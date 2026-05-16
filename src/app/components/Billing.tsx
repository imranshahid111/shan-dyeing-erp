import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Plus, Eye, Wallet, MoreVertical, X, Download, Printer, Calendar, DollarSign, CreditCard, Hash, FileEdit, Search, User, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { PDFInvoice } from './PDFInvoice';

export default function Billing() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<DeliveryOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DeliveryOrderItem | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<DeliveryOrderItem | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');

  // Customer Selection State
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Organization details once
  useEffect(() => {
    organizationService.getOrganization().then(setOrg).catch(console.error);
  }, []);

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!customerSearch || selectedCustomer) return;
      try {
        setLoadingCustomers(true);
        const res = await customerService.getCustomers(customerSearch);
        setCustomers(res.data);
      } catch (error) {
        console.error("Failed to fetch customers", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerSearch, selectedCustomer]);

  // Fetch invoices when customer is selected or search changes
  const fetchInvoices = async () => {
    if (!selectedCustomer) {
      setInvoices([]);
      return;
    }
    try {
      setLoading(true);
      const invRes = await deliveryOrderService.getDeliveryOrders('billed', 1, 100, selectedCustomer.id, undefined, undefined, search);
      setInvoices(invRes.data);
    } catch (error) {
      console.error("Failed to load invoices", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedCustomer, search]);

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
      alert("Payment recorded successfully!");
      setPaymentInvoice(null);
      setPaymentAmount('0');
      setReference('');
      setNotes('');
      fetchInvoices();
    } catch (error) {
      alert("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSelect = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomers([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Invoices & Billing</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all sales invoices and track payments</p>
        </div>
        <button
          onClick={() => navigate('/billing/new')}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 font-semibold"
        >
          <Plus size={20} />
          Create New Invoice
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Customer Searchable Dropdown */}
        <div className="flex-1 relative">
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
              <div className="relative w-full">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Select customer to view invoices..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-700 font-medium transition-all"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    if (selectedCustomer) setSelectedCustomer(null);
                  }}
                />
                {loadingCustomers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-blue-600" size={18} />
                  </div>
                )}
              </div>
           </div>
           
           {customerSearch && !selectedCustomer && customers.length > 0 && (
             <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl mt-2 shadow-2xl z-20 max-h-60 overflow-y-auto">
               {customers.map(c => (
                 <button
                   key={c.id}
                   type="button"
                   onClick={() => handleCustomerSelect(c)}
                   className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors font-semibold text-gray-700 flex justify-between items-center"
                 >
                   <div>
                     <p>{c.name}</p>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest">{c.customer_code}</p>
                   </div>
                   <p className="text-xs font-bold text-blue-600">Rs {Number(c.outstanding_amount).toLocaleString()}</p>
                 </button>
               ))}
             </div>
           )}
        </div>

        {/* Invoice Search */}
        {selectedCustomer && (
          <div className="flex-1 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Filter by DO number..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-700 font-medium transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {!selectedCustomer ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <div className="p-6 bg-gray-50 rounded-full mb-4">
              <User size={48} className="opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Customer Selected</h3>
            <p className="text-sm font-medium">Please select a customer from the dropdown above to view their invoices.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-500 font-black">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Gazana</th>
                  <th className="px-6 py-4 text-right">Total (Rs)</th>
                  <th className="px-6 py-4 text-right text-blue-600">Paid (Rs)</th>
                  <th className="px-6 py-4 text-right text-orange-600">Due (Rs)</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-sm">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading customer invoices...</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                      <p className="font-bold uppercase tracking-widest text-[10px]">No invoices found for this customer</p>
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => {
                  const due = Math.max(Number(inv.total_amount) - Number(inv.paid_amount || 0), 0);
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 font-mono">#{inv.order_no}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(inv.order_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">{inv.total_gray_gazana} GZ</td>
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
                            <button 
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this invoice? This will revert the order to completed status and delete all associated payments.")) {
                                  try {
                                    await deliveryOrderService.deleteInvoice(inv.id);
                                    alert("Invoice deleted successfully!");
                                    fetchInvoices();
                                  } catch (error) {
                                    alert("Failed to delete invoice");
                                  }
                                }
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold"
                            >
                              <Trash2 size={16} /> Delete Invoice
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
        )}
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && org && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
               <div>
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight">System Invoice Ledger</h3>
                  <p className="text-sm text-gray-500 font-semibold uppercase tracking-widest text-[10px] mt-1">High fidelity document preview</p>
               </div>
               <div className="flex items-center gap-3">
                  <PDFDownloadLink
                    document={<PDFInvoice inv={selectedInvoice} org={org} />}
                    fileName={`Invoice-${selectedInvoice.order_no}.pdf`}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-500/20"
                  >
                    {({ loading }) => (loading ? 'Preparing...' : 'Download PDF')}
                  </PDFDownloadLink>
                  <button 
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    <X size={20} />
                  </button>
               </div>
            </div>
            <div className="flex-1 bg-gray-100 p-4 overflow-hidden">
               <PDFViewer width="100%" height="100%" className="rounded-xl border border-gray-200 shadow-inner" showToolbar={false}>
                  <PDFInvoice inv={selectedInvoice} org={org} />
               </PDFViewer>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
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
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
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
