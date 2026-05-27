import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Eye, Wallet, MoreVertical, X, Calendar, DollarSign, ArrowLeft, Filter } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { PDFInvoice } from './PDFInvoice';

export default function CustomerInvoices() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState<DeliveryOrderItem[]>([]);
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState<DeliveryOrderItem | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<DeliveryOrderItem | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomerData = async () => {
    try {
      if (id) {
        const res = await customerService.getCustomer(id);
        setCustomer(res);
      }
    } catch (error) {
      console.error("Failed to load customer", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const [invRes, orgRes] = await Promise.all([
        deliveryOrderService.getDeliveryOrders('billed', currentPage, pageSize, id, startDate || undefined, endDate || undefined),
        organizationService.getOrganization()
      ]);
      setInvoices(invRes.data);
      setTotalItems(invRes.total);
      setTotalPages(Math.ceil(invRes.total / pageSize) || 1);
      setOrg(orgRes);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [id, startDate, endDate]);

  useEffect(() => {
    fetchInvoices();
  }, [id, startDate, endDate, currentPage]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await deliveryOrderService.addPayment(paymentInvoice.id, {
        amount: parseFloat(paymentAmount),
        paymentDate,
        method: paymentMethod,
        reference,
        notes
      });
      toast.success("Payment recorded successfully!");
      setPaymentInvoice(null);
      setPaymentAmount('0');
      setReference('');
      setNotes('');
      fetchInvoices();
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => navigate('/billing')}
          className="p-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {customer ? `${customer.name}'s Invoices` : 'Customer Invoices'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">View and filter billing history for this customer</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-700 font-medium transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-700 font-medium transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => { setStartDate(''); setEndDate(''); }}
          className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
        >
          <Filter size={18} />
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-black">
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Gazana</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-6 py-4 text-right">Total (Rs)</th>
                <th className="px-6 py-4 text-right text-blue-600">Paid (Rs)</th>
                <th className="px-6 py-4 text-right text-orange-600">Due (Rs)</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-sm">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Loading invoices...
                  </td>
                </tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    No invoices found for the selected dates.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => {
                const due = Math.max(Number(inv.total_amount) - Number(inv.paid_amount || 0), 0);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 font-mono">#{inv.order_no}</td>
                    <td className="px-6 py-4 text-gray-800 font-semibold">{inv.order_date?.split('T')[0]}</td>
                    <td className="px-6 py-4 text-right">{inv.total_gray_gazana} GZ</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-500">{inv.rate ? `Rs ${inv.rate}/${inv.rate_unit === 'yard' ? 'Gaz' : 'Mtr'}` : '-'}</td>
                    <td className="px-6 py-4 text-right font-bold">{Number(inv.total_amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{Number(inv.paid_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-orange-600">{due.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center relative">
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === String(inv.id) ? null : String(inv.id))}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeDropdown === String(inv.id) && (
                        <div className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-10">
                          <button 
                            onClick={() => { setSelectedInvoice(inv); setActiveDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-semibold"
                          >
                            <Eye size={16} /> View Invoice
                          </button>
                          <button 
                            onClick={() => { 
                              setPaymentInvoice(inv); 
                              setPaymentAmount('0');
                              setActiveDropdown(null); 
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors font-semibold"
                          >
                            <Wallet size={16} /> Add Payment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalItems > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl">
            <span className="text-xs font-bold text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-100 rounded-lg shadow-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal — full-screen, header always visible */}
      {selectedInvoice && org && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'transparent',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            animation: 'overlayIn 150ms ease both',
          }}
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              animation: 'dialogIn 180ms ease both',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky header — always on top */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
              flexShrink: 0,
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Invoice Preview</h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>Order #{selectedInvoice.order_no}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <PDFDownloadLink
                  document={<PDFInvoice inv={selectedInvoice} org={org} />}
                  fileName={`Invoice-${selectedInvoice.order_no}.pdf`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1.25rem',
                    background: '#2563eb', color: 'white',
                    borderRadius: '10px', fontWeight: 700,
                    fontSize: '0.875rem', textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}
                >
                  {({ loading }) => (loading ? 'Preparing...' : '⬇ Download PDF')}
                </PDFDownloadLink>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  style={{
                    width: '2.25rem', height: '2.25rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f1f5f9', border: 'none',
                    borderRadius: '10px', cursor: 'pointer',
                    color: '#475569', fontSize: '1.25rem',
                    fontWeight: 700,
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* PDF Viewer */}
            <div style={{ flex: 1, background: '#e2e8f0', padding: '1rem', overflow: 'hidden' }}>
              <PDFViewer width="100%" height="100%" showToolbar={false}
                style={{ borderRadius: '10px', border: '1px solid #cbd5e1' }}
              >
                <PDFInvoice inv={selectedInvoice} org={org} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 border border-gray-100">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setPaymentInvoice(null)} className="absolute right-6 top-6 p-2 hover:bg-white/20 rounded-xl transition-colors">
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold tracking-tight">RECORD PAYMENT</h3>
              <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] mt-2 uppercase">Reference: {paymentInvoice.order_no}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Gross Total</p>
                  <p className="text-2xl font-black">{Number(paymentInvoice.total_amount).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-orange-400">
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Balance Due</p>
                  <p className="text-2xl font-black">{(Number(paymentInvoice.total_amount) - Number(paymentInvoice.paid_amount || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receive Amount (Rs)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 font-black text-xs">PKR</span>
                    <input 
                      type="number" 
                      required 
                      step="0.01"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-lg text-slate-900" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receipt Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date" 
                      required 
                      className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-slate-800" 
                      value={paymentDate} 
                      onChange={e => setPaymentDate(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pay Mode</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none bg-white font-bold text-slate-800" 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque Deposit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ref/Chq #</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-slate-800" 
                    placeholder="Enter ID" 
                    value={reference} 
                    onChange={e => setReference(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Note</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-medium text-slate-700" 
                  placeholder="Record summary..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'SAVING...' : 'CONFIRM RECEIPT'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setPaymentInvoice(null)} 
                  className="px-8 py-4 bg-gray-100 text-slate-700 rounded-2xl font-black tracking-widest hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
