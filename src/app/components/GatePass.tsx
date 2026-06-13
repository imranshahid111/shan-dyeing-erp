//@ts-nocheck
import { useState, useEffect } from 'react';
import { Printer, Save, ClipboardCheck, Loader2, Plus, Search, CalendarDays, Hash, ArrowLeft, Truck, User, Trash2, X } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { gatePassService, GatePassItem, GatePassDOItem } from '../services/gatePassService';
import { organizationService } from '../services/organizationService';
import { toast } from 'sonner';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { PDFGatePass } from './PDFGatePass'; // Make sure the path is correct
// GatePass.tsx - Imports section mein yeh add karo
import { pdf } from '@react-pdf/renderer';

interface FormDORow {
  delivery_order_id: number;
  order_no: string;
  party_name: string;
  lot_no: string;
  description: string;
  bundles: string;
  gazana_total: string;
}

export default function GatePass() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderItem[]>([]);
  const [gatePassNo, setGatePassNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [canDelete, setCanDelete] = useState(true);
  const [doRows, setDoRows] = useState<FormDORow[]>([]);
  const [doSearch, setDoSearch] = useState('');
  const [doDropdownOpen, setDoDropdownOpen] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  const fetchGatePassHistory = async () => {
    try { setLoadingList(true); const res = await gatePassService.getGatePasses(); setGatePasses(res || []); }
    catch (err) { console.error(err); } finally { setLoadingList(false); }
  };

  const fetchDOsAndGPNo = async () => {
    try {
      setLoadingOrders(true);
      const [doRes, gpRes] = await Promise.all([
        deliveryOrderService.getDeliveryOrders('', 1, 500),
        gatePassService.getNextGatePassNumber()
      ]);
      setDeliveryOrders(doRes.data || []);
      setGatePassNo(gpRes.nextNumber || 'GP-0001');
    } catch (err) { console.error(err); } finally { setLoadingOrders(false); }
  };

  useEffect(() => {
    fetchGatePassHistory();
    organizationService.getOrganization().then(org => setOrganization(org)).catch(console.error);
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) { const p = JSON.parse(saved); setCanDelete(p.role === 'admin' ? true : (p.privileges?.can_delete ?? false)); }
    } catch (e) { console.error(e); }
  }, []);

  const handleOpenAddForm = () => { fetchDOsAndGPNo(); setShowAddForm(true); };

  const resetForm = () => {
    setShowAddForm(false); setDoRows([]); setVehicleNo(''); setDriverName('');
    setDriverMobile(''); setNotes(''); setDoSearch('');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this Gate Pass?')) return;
    try { await gatePassService.deleteGatePass(id); toast.success('Deleted!'); fetchGatePassHistory(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // Available DOs not already added in form rows
  const usedIds = doRows.map(r => r.delivery_order_id);
  const availableDOs = deliveryOrders.filter(o => !usedIds.includes(o.id));
  const filteredAvailable = availableDOs.filter(o =>
    o.order_no.toLowerCase().includes(doSearch.toLowerCase()) ||
    (o.customer?.name || '').toLowerCase().includes(doSearch.toLowerCase())
  );

  const addDOToRows = (o: DeliveryOrderItem) => {
    setDoRows(prev => [...prev, {
      delivery_order_id: o.id,
      order_no: o.order_no,
      party_name: o.customer?.name || '',
      lot_no: (o as any).gray_lot?.lot_no || '',
      description: '',
      bundles: '0',
      gazana_total: String(Number(o.total_gray_gazana || 0)),
    }]);
    setDoSearch(''); setDoDropdownOpen(false);
  };

  const removeDORow = (idx: number) => setDoRows(prev => prev.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: string, val: string) =>
    setDoRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (doRows.length === 0) { toast.error('Add at least one Delivery Order'); return; }
    try {
      setIsSaving(true);
      await gatePassService.createGatePass({
        gate_pass_date: date, vehicle_no: vehicleNo, driver_name: driverName,
        driver_mobile: driverMobile, notes,
        items: doRows.map(r => ({
          delivery_order_id: r.delivery_order_id, order_no: r.order_no,
          description: r.description, bundles: Number(r.bundles) || 0,
          gazana_total: Number(r.gazana_total) || 0,
        }))
      });
      toast.success('Gate Pass saved!'); resetForm(); fetchGatePassHistory();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setIsSaving(false); }
  };

// In GatePass.tsx - Updated handlePrint function
const handlePrint = async (gp: GatePassItem) => {
  try {
    // Create PDF blob
    const blob = await pdf(<PDFGatePass gp={gp} org={organization} />).toBlob();
    const url = URL.createObjectURL(blob);
    
    // Open in new window for printing
    const printWindow = window.open(url, '_blank', 'width=1100,height=800');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }
    
    // Auto print after load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    };
    
    toast.success('Gate pass opened for printing');
  } catch (error) {
    console.error('Print error:', error);
    toast.error('Failed to generate PDF for printing');
  }
};

// For direct PDF download with 2 copies
const handleDownloadPDF = async (gp: GatePassItem) => {
  try {
    const blob = await pdf(<PDFGatePass gp={gp} org={organization} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GatePass_${gp.gate_pass_no}_2Copies.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('PDF with 2 copies downloaded successfully!');
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download PDF');
  }
};

  // Alternative: Direct download link
  const handlePrintWithDownload = (gp: GatePassItem) => {
    // This will open a new tab with PDF viewer
    const pdfBlob = pdf(<PDFGatePass gp={gp} org={organization} />).toBlob();
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  };

  const filtered = gatePasses.filter(gp => {
    const t = search.toLowerCase();
    const allDOs = (gp.items || []).map(it => `${it.delivery_order?.order_no} ${it.delivery_order?.customer?.name}`).join(' ').toLowerCase();
    return gp.gate_pass_no.toLowerCase().includes(t) || (gp.driver_name || '').toLowerCase().includes(t) || (gp.vehicle_no || '').toLowerCase().includes(t) || allDOs.includes(t);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ClipboardCheck size={22} style={{ color: 'var(--brand-500)' }} />Gate Pass Management
          </h2>
          <p>{showAddForm ? 'Create a new gate pass with multiple DOs' : `${gatePasses.length} gate pass record(s)`}</p>
        </div>
        <div>
          {showAddForm
            ? <button className="btn btn-secondary" onClick={resetForm}><ArrowLeft size={16} />Back to List</button>
            : <button className="btn btn-primary" onClick={handleOpenAddForm}><Plus size={16} />Add Gate Pass</button>
          }
        </div>
      </div>

      {!showAddForm ? (
        <div className="card">
          <div className="card-header">
            <div className="search-bar" style={{ maxWidth: '20rem', flex: 1 }}>
              <Search className="search-bar-icon" size={16} />
              <input type="text" placeholder="Search GP, driver, DO..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <span className="badge badge-gray">{filtered.length} Records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loadingList ? (
              <div className="loading-state"><div className="loading-spinner" /><p>Loading...</p></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><ClipboardCheck size={26} /></div>
                <p className="empty-state-title">No Gate Passes</p>
                <p className="empty-state-desc">Create one using "Add Gate Pass".</p>
                <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleOpenAddForm}><Plus size={15} />Create Gate Pass</button>
              </div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th><div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}><Hash size={12} />GP No</div></th>
                  <th><div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}><CalendarDays size={12} />Date</div></th>
                  <th>DOs</th>
                  <th>Vehicle / Driver</th>
                  <th>Total Gazana</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map(gp => {
                    const totalGaz = (gp.items || []).reduce((s, it) => s + Number(it.gazana_total || 0), 0);
                    return (
                      <tr key={gp.id}>
                        <td><p style={{ fontFamily:'monospace', fontWeight:700, color:'var(--gray-900)', fontSize:'0.875rem' }}>{gp.gate_pass_no}</p></td>
                        <td style={{ color:'var(--gray-500)', fontSize:'0.8125rem', whiteSpace:'nowrap' }}>
                          {gp.gate_pass_date ? new Date(gp.gate_pass_date).toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                        </td>
                        <td>
                          {(gp.items || []).map((it, i) => (
                            <div key={i} style={{ marginBottom: i < gp.items.length - 1 ? 4 : 0 }}>
                              <span style={{ fontFamily:'monospace', fontWeight:600, color:'var(--brand-600)', fontSize:'0.8rem' }}>{it.delivery_order?.order_no || '—'}</span>
                              <span style={{ fontSize:'0.7rem', color:'var(--gray-500)', marginLeft:4 }}>{it.delivery_order?.customer?.name || ''}</span>
                            </div>
                          ))}
                        </td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}><Truck size={13} style={{ color:'var(--gray-400)' }} /><span style={{ fontWeight:500 }}>{gp.vehicle_no || '—'}</span></div>
                          <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}><User size={13} style={{ color:'var(--gray-400)' }} /><span style={{ fontSize:'0.8rem', color:'var(--gray-600)' }}>{gp.driver_name || '—'}</span></div>
                        </td>
                        <td><span style={{ fontWeight:700, color:'var(--brand-700)' }}>{totalGaz.toLocaleString()} GZ</span></td>
                        <td style={{ textAlign: 'center' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
    {/* Print Button - Opens PDF for printing */}
    {organization && (
      <button 
        className="icon-btn" 
        title="Print Gate Pass (2 Copies)" 
        onClick={() => handlePrint(gp)}
        style={{ background: 'var(--brand-50)', color: 'var(--brand-600)' }}
      >
        <Printer size={13} />
      </button>
    )}
    
    {/* Download PDF Button */}
    {organization && (
      <button
        className="icon-btn"
        title="Download PDF (2 Copies)"
        onClick={() => handleDownloadPDF(gp)}
        style={{ background: 'var(--success-50)', color: 'var(--success-600)' }}
      >
        <Save size={13} />
      </button>
    )}
    
    {/* Delete Button */}
    {canDelete && (
      <button className="icon-btn danger" title="Delete" onClick={() => handleDelete(gp.id)}>
        <Trash2 size={13} />
      </button>
    )}
  </div>
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Header fields */}
          <div className="card">
            <div className="card-header"><h3 style={{ fontSize:'0.9375rem', fontWeight:700, margin:0 }}>Gate Pass Details</h3></div>
            <div className="card-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              <div><label className="form-label">Date</label><input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} required /></div>
              <div><label className="form-label">Gate Pass No</label><input type="text" className="input-field" value={gatePassNo} disabled /></div>
              <div><label className="form-label">Vehicle Number</label><input type="text" className="input-field" placeholder="LHR-123" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} required /></div>
              <div><label className="form-label">Driver Name</label><input type="text" className="input-field" placeholder="Driver name" value={driverName} onChange={e => setDriverName(e.target.value)} required /></div>
              <div><label className="form-label">Driver Mobile</label><input type="tel" className="input-field" placeholder="+92 300 0000000" value={driverMobile} onChange={e => setDriverMobile(e.target.value)} required /></div>
              <div><label className="form-label">Notes</label><input type="text" className="input-field" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
          </div>

          {/* DO Table */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize:'0.9375rem', fontWeight:700, margin:0 }}>Delivery Orders ({doRows.length})</h3>
              {/* DO search dropdown */}
              <div style={{ position:'relative', width:'280px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', padding:'6px 12px', cursor:'pointer' }}
                  onClick={() => setDoDropdownOpen(v => !v)}>
                  <Search size={14} style={{ color:'var(--gray-400)' }} />
                  <input type="text" placeholder="Search & add DO..." value={doSearch}
                    style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.875rem', width:'100%' }}
                    onChange={e => { setDoSearch(e.target.value); setDoDropdownOpen(true); }}
                    onClick={e => { e.stopPropagation(); setDoDropdownOpen(true); }}
                    disabled={loadingOrders}
                  />
                </div>
                {doDropdownOpen && filteredAvailable.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid var(--gray-200)', borderRadius:'var(--radius-md)', boxShadow:'0 8px 24px rgba(0,0,0,.12)', zIndex:50, maxHeight:220, overflowY:'auto', marginTop:4 }}>
                    {filteredAvailable.map(o => (
                      <div key={o.id} onClick={() => addDOToRows(o)}
                        style={{ padding:'8px 12px', cursor:'pointer', borderBottom:'1px solid var(--gray-50)' }}
                        onMouseEnter={e => (e.currentTarget.style.background='var(--brand-50)')}
                        onMouseLeave={e => (e.currentTarget.style.background='white')}>
                        <div style={{ fontWeight:600, fontFamily:'monospace', fontSize:'0.85rem' }}>{o.order_no}</div>
                        <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>{o.customer?.name} — {Number(o.total_gray_gazana || 0)} GZ</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
              {doRows.length === 0 ? (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--gray-400)' }}>
                  <ClipboardCheck size={32} style={{ margin:'0 auto 0.5rem', opacity:0.3 }} />
                  <p style={{ fontSize:'0.875rem' }}>Search and add Delivery Orders above</p>
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'var(--gray-50)', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', color:'var(--gray-500)' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>DO No</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Lot No</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Party Name</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1px solid var(--gray-200)' }}>Description</th>
                      <th style={{ padding:'10px 12px', textAlign:'center', borderBottom:'1px solid var(--gray-200)' }}>Bundles</th>
                      <th style={{ padding:'10px 12px', textAlign:'right', borderBottom:'1px solid var(--gray-200)' }}>Gazana Total</th>
                      <th style={{ padding:'10px 12px', textAlign:'center', borderBottom:'1px solid var(--gray-200)' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {doRows.map((row, i) => (
                      <tr key={row.delivery_order_id} style={{ borderBottom:'1px solid var(--gray-100)' }}>
                        <td style={{ padding:'8px 12px', fontFamily:'monospace', fontWeight:600, color:'var(--brand-600)', fontSize:'0.875rem' }}>{row.order_no}</td>
                        <td style={{ padding:'8px 12px', color:'var(--gray-600)', fontSize:'0.875rem' }}>{row.lot_no || '—'}</td>
                        <td style={{ padding:'8px 12px', fontWeight:600, fontSize:'0.875rem' }}>{row.party_name || '—'}</td>
                        <td style={{ padding:'6px 8px' }}>
                          <input type="text" value={row.description} onChange={e => updateRow(i,'description',e.target.value)}
                            placeholder="Optional desc..." style={{ border:'1px solid var(--gray-200)', borderRadius:6, padding:'4px 8px', fontSize:'0.8rem', width:'100%', outline:'none' }} />
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input type="number" min="0" value={row.bundles} onChange={e => updateRow(i,'bundles',e.target.value)}
                            style={{ border:'1px solid var(--gray-200)', borderRadius:6, padding:'4px 8px', fontSize:'0.8rem', width:70, textAlign:'center', outline:'none' }} />
                        </td>
                        <td style={{ padding:'6px 8px' }}>
                          <input type="number" min="0" step="0.01" value={row.gazana_total} onChange={e => updateRow(i,'gazana_total',e.target.value)}
                            style={{ border:'1px solid var(--gray-200)', borderRadius:6, padding:'4px 8px', fontSize:'0.8rem', width:100, textAlign:'right', outline:'none' }} />
                        </td>
                        <td style={{ padding:'6px 8px', textAlign:'center' }}>
                          <button type="button" onClick={() => removeDORow(i)}
                            style={{ background:'var(--error-50)', color:'var(--error-600)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background:'var(--gray-50)', fontWeight:700 }}>
                      <td colSpan={5} style={{ padding:'10px 12px', textAlign:'right', fontSize:'0.875rem', color:'var(--gray-600)' }}>Total Gazana:</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:'monospace', color:'var(--brand-700)' }}>
                        {doRows.reduce((s, r) => s + (Number(r.gazana_total) || 0), 0).toLocaleString()} GZ
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--gray-100)', display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving || doRows.length === 0}>
                {isSaving ? <><Loader2 className="animate-spin" size={16} />Saving...</> : <><Save size={16} />Save Gate Pass</>}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}