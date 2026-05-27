//@ts-nocheck
import { useState, useEffect } from 'react';
import { Printer, Save, ClipboardCheck, Loader2, Plus, Search, CalendarDays, Hash, ArrowLeft, Truck, User, Eye, X, Trash2 } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { gatePassService, GatePassItem } from '../services/gatePassService';
import { organizationService } from '../services/organizationService';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFGatePass } from './PDFGatePass';

export default function GatePass() {
  // Navigation / View state
  const [showAddForm, setShowAddForm] = useState(false);

  // List states
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Gate Pass for high-fidelity PDF viewing modal
  const [selectedGatePassForView, setSelectedGatePassForView] = useState<GatePassItem | null>(null);
  const [org, setOrg] = useState<any>(null);

  // Form states
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderItem[]>([]);
  const [gatePassNo, setGatePassNo] = useState('');
  const [selectedDO, setSelectedDO] = useState<DeliveryOrderItem | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [canDelete, setCanDelete] = useState(true);

  // Fetch Delivery Orders and Next Number for Form
  const fetchDOsAndGPNo = async () => {
    try {
      setLoadingOrders(true);
      const doRes = await deliveryOrderService.getDeliveryOrders('', 1, 200);
      setDeliveryOrders(doRes.data || []);

      const gpRes = await gatePassService.getNextGatePassNumber();
      setGatePassNo(gpRes.nextNumber || 'GP-0001');
    } catch (err) {
      console.error("Failed to load initial gate pass data:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Gate Pass list history
  const fetchGatePassHistory = async () => {
    try {
      setLoadingList(true);
      const res = await gatePassService.getGatePasses();
      setGatePasses(res || []);
    } catch (err) {
      console.error("Failed to load gate passes:", err);
    } finally {
      setLoadingList(false);
    }
  };

  // Delete Gate Pass and free up associated Delivery Order
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this Gate Pass? This will free up the associated Delivery Order reference.')) return;
    try {
      await gatePassService.deleteGatePass(id);
      toast.success('Gate Pass deleted successfully!');
      fetchGatePassHistory();
    } catch (err: any) {
      console.error("Failed to delete Gate Pass:", err);
      toast.error(err.response?.data?.message || 'Failed to delete Gate Pass');
    }
  };

  useEffect(() => {
    fetchGatePassHistory();
    // Fetch Organization details once
    organizationService.getOrganization().then(setOrg).catch(console.error);

    // Parse user privileges
    try {
      const saved = localStorage.getItem('erp_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'admin') {
          setCanDelete(true);
        } else {
          setCanDelete(parsed.privileges?.can_delete ?? false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleOpenAddForm = () => {
    fetchDOsAndGPNo();
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setSelectedDO(null);
    setVehicleNo('');
    setDriverName('');
    setDriverMobile('');
    setNotes('');
  };

  // Filter Delivery Orders to only show those that do NOT have a Gate Pass already
  const availableDOs = deliveryOrders.filter(order => !order.gate_pass);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDO) {
      toast.error("Please select a Delivery Order reference.");
      return;
    }

    try {
      setIsSaving(true);
      await gatePassService.createGatePass({
        delivery_order_id: selectedDO.id,
        gate_pass_date: date,
        vehicle_no: vehicleNo,
        driver_name: driverName,
        driver_mobile: driverMobile,
        notes: notes
      });

      toast.success("Gate Pass saved successfully!");
      handleCloseAddForm();
      fetchGatePassHistory();
    } catch (err: any) {
      console.error("Failed to save Gate Pass:", err);
      toast.error(err.response?.data?.message || "Failed to save Gate Pass.");
    } finally {
      setIsSaving(false);
    }
  };

  // High fidelity printable pop-up generator
  const handlePrintGatePass = (gp: GatePassItem) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Gate Pass ${gp.gate_pass_no}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                padding: 40px;
                color: #1e293b;
                line-height: 1.5;
              }
              .gate-pass {
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 40px;
                background: white;
                max-width: 800px;
                margin: 0 auto;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h2 {
                font-size: 26px;
                font-weight: 900;
                letter-spacing: 0.1em;
                margin: 0;
                color: #0f172a;
              }
              .header p {
                font-size: 13px;
                color: #64748b;
                margin-top: 6px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 25px;
              }
              .grid-col p {
                margin: 0;
              }
              .label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.05em;
              }
              .value {
                font-weight: 700;
                color: #1e293b;
                font-size: 15px;
                margin-top: 4px !important;
              }
              .divider {
                border-top: 1px solid #f1f5f9;
                padding-top: 15px;
                margin-bottom: 15px;
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 80px;
                padding-top: 40px;
              }
              .sig-box {
                border-top: 1.5px solid #94a3b8;
                padding-top: 8px;
                width: 40%;
                text-align: center;
                font-size: 12px;
                font-weight: 700;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
            </style>
          </head>
          <body>
            <div class="gate-pass">
              <div class="header">
                <h2>GATE PASS</h2>
                <p>Shan Dyeing — Textile Factory</p>
              </div>
              <div class="grid">
                <div class="grid-col">
                  <p class="label">Gate Pass No:</p>
                  <p class="value">${gp.gate_pass_no}</p>
                </div>
                <div class="grid-col">
                  <p class="label">Date:</p>
                  <p class="value">${new Date(gp.gate_pass_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <div class="divider">
                <p class="label">Party Name / Customer:</p>
                <p class="value">${gp.delivery_order?.customer?.name || '—'}</p>
              </div>
              <div class="divider">
                <p class="label">DO Reference Number:</p>
                <p class="value" style="font-family: monospace; font-weight: 800;">${gp.delivery_order?.order_no || '—'}</p>
              </div>
              <div class="divider">
                <p class="label">Total Gazana:</p>
                <p class="value">${gp.delivery_order ? `${Number(gp.delivery_order.total_gray_gazana || 0).toLocaleString()} GZ` : '—'}</p>
              </div>
              <div class="divider">
                <p class="label">Vehicle Number:</p>
                <p class="value">${gp.vehicle_no || '—'}</p>
              </div>
              <div class="divider">
                <p class="label">Driver Name:</p>
                <p class="value">${gp.driver_name || '—'}</p>
              </div>
              <div class="divider">
                <p class="label">Driver Mobile:</p>
                <p class="value">${gp.driver_mobile || '—'}</p>
              </div>
              <div class="divider" style="margin-bottom: 0;">
                <p class="label">Additional Notes / Transport Details:</p>
                <p class="value">${gp.notes || '—'}</p>
              </div>
              <div class="signatures">
                <div class="sig-box">Security Signature</div>
                <div class="sig-box">Authorized Signature</div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrintCurrent = () => {
    if (!selectedDO) return;
    const currentGP: GatePassItem = {
      id: 0,
      gate_pass_no: gatePassNo,
      gate_pass_date: date,
      delivery_order_id: selectedDO.id,
      vehicle_no: vehicleNo,
      driver_name: driverName,
      driver_mobile: driverMobile,
      notes: notes,
      delivery_order: selectedDO
    };
    handlePrintGatePass(currentGP);
  };

  const formField = (label: string, input: React.ReactNode) => (
    <div>
      <label className="form-label">{label}</label>
      {input}
    </div>
  );

  // Search filtering logic
  const filteredGatePasses = gatePasses.filter(gp => {
    const term = search.toLowerCase();
    return (
      gp.gate_pass_no.toLowerCase().includes(term) ||
      (gp.driver_name || '').toLowerCase().includes(term) ||
      (gp.vehicle_no || '').toLowerCase().includes(term) ||
      (gp.delivery_order?.order_no || '').toLowerCase().includes(term) ||
      (gp.delivery_order?.customer?.name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <ClipboardCheck size={22} style={{ color: 'var(--brand-500)' }} />
            Gate Pass Management
          </h2>
          <p>{showAddForm ? 'Create a new gate pass reference' : `${gatePasses.length} gate pass record(s) found`}</p>
        </div>
        <div>
          {showAddForm ? (
            <button className="btn btn-secondary" onClick={handleCloseAddForm}>
              <ArrowLeft size={16} />
              Back to List
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenAddForm}>
              <Plus size={16} />
              Add Gate Pass
            </button>
          )}
        </div>
      </div>

      {/* Conditional View Rendering */}
      {!showAddForm ? (
        /* List View */
        <div className="card">
          {/* List Search Bar */}
          <div className="card-header">
            <div className="search-bar" style={{ maxWidth: '20rem', flex: 1 }}>
              <Search className="search-bar-icon" size={16} />
              <input
                type="text"
                placeholder="Search by GP no, driver, DO..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span className="badge badge-gray">{filteredGatePasses.length} Records</span>
          </div>

          {/* List Table */}
          <div style={{ overflowX: 'auto' }}>
            {loadingList ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading gate passes...</p>
              </div>
            ) : filteredGatePasses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><ClipboardCheck size={26} /></div>
                <p className="empty-state-title">No Gate Passes</p>
                <p className="empty-state-desc">Create a new gate pass by clicking the "Add Gate Pass" button.</p>
                <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleOpenAddForm}>
                  <Plus size={15} /> Create Gate Pass
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Hash size={12} />GP No</div></th>
                    <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><CalendarDays size={12} />Date</div></th>
                    <th>DO Ref</th>
                    <th>Customer Name</th>
                    <th>Vehicle No</th>
                    <th>Driver Details</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGatePasses.map((gp) => (
                    <tr key={gp.id}>
                      <td>
                        <p style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.875rem' }}>
                          {gp.gate_pass_no}
                        </p>
                      </td>
                      <td style={{ color: 'var(--gray-500)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {gp.gate_pass_date
                          ? new Date(gp.gate_pass_date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--brand-600)' }}>
                          {gp.delivery_order?.order_no || '—'}
                        </span>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                          {gp.delivery_order?.customer?.name || '—'}
                        </p>
                        {gp.delivery_order?.customer?.customer_code && (
                          <p style={{ fontSize: '0.6875rem', color: 'var(--gray-400)' }}>
                            {gp.delivery_order.customer.customer_code}
                          </p>
                        )}
                      </td>
                      <td style={{ color: 'var(--gray-700)', fontWeight: 500 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Truck size={13} style={{ color: 'var(--gray-400)' }} />
                          {gp.vehicle_no || '—'}
                        </span>
                      </td>
                      <td>
                        <p style={{ fontWeight: 600, color: 'var(--gray-850)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={13} style={{ color: 'var(--gray-400)' }} />
                          {gp.driver_name || '—'}
                        </p>
                        {gp.driver_mobile && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginLeft: '17px' }}>{gp.driver_mobile}</p>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                          <button
                            className="row-action-btn view"
                            onClick={() => setSelectedGatePassForView(gp)}
                          >
                            <Eye size={13} />
                            View
                          </button>
                          <button
                            className="icon-btn"
                            title="Print Document"
                            onClick={() => handlePrintGatePass(gp)}
                          >
                            <Printer size={13} />
                          </button>
                          {canDelete && (
                            <button
                              className="icon-btn danger"
                              title="Delete Gate Pass"
                              onClick={() => handleDelete(gp.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Form View */
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem', alignItems: 'start',
        }}>
          {/* Form Panel */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                Gate Pass Details
              </h3>
            </div>
            <form onSubmit={handleSave} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {formField('Date',
                  <input
                    type="date"
                    className="input-field"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                )}
                {formField('Gate Pass No',
                  <input
                    type="text"
                    className="input-field"
                    value={gatePassNo}
                    placeholder="Generating..."
                    disabled
                  />
                )}
              </div>

              {formField('Delivery Order Reference',
                <div style={{ position: 'relative' }}>
                  <select
                    className="input-field"
                    value={selectedDO?.id || ''}
                    onChange={e => {
                      const selectedId = Number(e.target.value);
                      const order = deliveryOrders.find(o => o.id === selectedId);
                      setSelectedDO(order || null);
                    }}
                    disabled={loadingOrders}
                    required
                  >
                    <option value="">
                      {loadingOrders ? 'Loading delivery orders...' : 'Select delivery order...'}
                    </option>
                    {availableDOs.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.order_no} — {order.customer?.name}
                      </option>
                    ))}
                  </select>
                  {loadingOrders && (
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Loader2 className="animate-spin text-blue-600" size={18} />
                    </div>
                  )}
                </div>
              )}

              {selectedDO && (
                <div style={{
                  padding: '0.875rem 1rem',
                  background: 'var(--brand-50)',
                  border: '1.5px solid var(--brand-100)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>Customer / Party Name</p>
                  <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{selectedDO.customer?.name || '—'}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--brand-600)', fontWeight: 600, marginTop: '0.25rem' }}>
                    Total Gazana: {Number(selectedDO.total_gray_gazana).toLocaleString()} GZ
                  </p>
                </div>
              )}

              {formField('Vehicle Number',
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. LHR-123-ABC"
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  required
                />
              )}

              {formField('Driver Name',
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter driver name"
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  required
                />
              )}

              {formField('Driver Mobile',
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+92 300 0000000"
                  value={driverMobile}
                  onChange={e => setDriverMobile(e.target.value)}
                  required
                />
              )}

              {formField('Notes',
                <textarea
                  className="input-field"
                  placeholder="Additional transport details..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isSaving ? 'Saving Gate Pass...' : 'Save Gate Pass'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePrintCurrent}
                  disabled={!selectedDO}
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </form>
          </div>

          {/* Print Preview */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                Print Preview
              </h3>
              <span className="badge badge-blue">Preview</span>
            </div>
            <div className="card-body">
              <div style={{
                border: '2px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                background: 'white',
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid var(--gray-200)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', margin: 0, color: 'var(--gray-900)' }}>
                    GATE PASS
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginTop: '0.375rem' }}>
                    Shan Dyeing — Textile Factory
                  </p>
                </div>

                {/* Details grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Gate Pass No:</p>
                    <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{gatePassNo || '—'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Date:</p>
                    <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                      {new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Party Name / Customer:</p>
                  <p style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{selectedDO?.customer?.name || '—'}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>DO Reference Number:</p>
                  <p style={{ fontWeight: 700, color: 'var(--gray-800)', fontFamily: 'monospace' }}>{selectedDO?.order_no || '—'}</p>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>Vehicle & Driver Details:</p>
                  <p style={{ color: 'var(--gray-700)', marginBottom: '0.375rem' }}>Vehicle: <strong>{vehicleNo || '_______________________'}</strong></p>
                  <p style={{ color: 'var(--gray-700)', marginBottom: '0.375rem' }}>Driver: <strong>{driverName || '_______________________'}</strong></p>
                  <p style={{ color: 'var(--gray-700)' }}>Mobile: <strong>{driverMobile || '_______________________'}</strong></p>
                </div>

                <div style={{ borderTop: '1px solid var(--gray-150)', paddingTop: '1rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Notes:</p>
                  <p style={{ color: 'var(--gray-700)', fontSize: '0.8125rem' }}>{notes || '—'}</p>
                </div>

                {/* Signatures */}
                <div style={{
                  borderTop: '1px solid var(--gray-150)',
                  paddingTop: '3.5rem', marginTop: '2rem',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <div style={{ borderTop: '1px solid var(--gray-400)', paddingTop: '0.5rem', width: '40%', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Security Signature</p>
                  </div>
                  <div style={{ borderTop: '1px solid var(--gray-400)', paddingTop: '0.5rem', width: '40%', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High Fidelity Centered PDF Viewer Modal */}
      {selectedGatePassForView && org && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '1024px',
            marginTop:'300px',
            height: '80vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 2rem',
              // marginTop:'100px',
              borderBottom: '1px solid var(--gray-100)',
              backgroundColor: 'var(--gray-25)',
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
                  GATE PASS VIEWER
                </h3>
                <p style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>
                  High Fidelity Document Preview
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PDFDownloadLink
                  document={<PDFGatePass gp={selectedGatePassForView} org={org} />}
                  fileName={`GatePass-${selectedGatePassForView.gate_pass_no}.pdf`}
                  style={{
                    backgroundColor: 'var(--brand-600)',
                    color: 'white',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    boxShadow: 'var(--shadow-brand)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 200ms',
                  }}
                >
                  {({ loading }) => (loading ? 'Preparing...' : 'Download PDF')}
                </PDFDownloadLink>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handlePrintGatePass(selectedGatePassForView)}
                >
                  <Printer size={16} />
                  Print
                </button>
                <button 
                  onClick={() => setSelectedGatePassForView(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-600)',
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-200)';
                    e.currentTarget.style.color = 'var(--gray-800)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                    e.currentTarget.style.color = 'var(--gray-600)';
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (PDF Viewer) */}
            <div style={{ flex: 1, backgroundColor: 'var(--gray-100)', padding: '1rem', overflow: 'hidden' }}>
              <PDFViewer width="100%" height="100%" style={{ borderRadius: '12px', border: '1px solid var(--gray-200)' }} showToolbar={false}>
                <PDFGatePass gp={selectedGatePassForView} org={org} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
