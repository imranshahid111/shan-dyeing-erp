import { useState, useEffect, useMemo } from 'react';
import { Plus, X, Search, User, DollarSign, Calendar, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { customerService, CustomerItem } from '../services/customerService';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { paymentService, PaymentItem, PaymentStats } from '../services/paymentService';

interface Allocation {
  invoiceId: number;
  orderNo: string;
  amount: number;
}

export default function Payments() {
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [customerInvoices, setCustomerInvoices] = useState<DeliveryOrderItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<number[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('0');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real data states
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    monthlyCollection: 0,
    pendingInvoices: 0,
    totalOutstanding: 0
  });
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [historySearch, setHistorySearch] = useState('');

  // Fetch customers for the dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        // If not searching, fetch all (initial list)
        const res = await customerService.getCustomers(customerSearch || '');
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
  }, [customerSearch]);

  // Fetch real payments history and stats
  const loadData = async () => {
    try {
      setLoadingPayments(true);
      const [pRes, sRes] = await Promise.all([
        paymentService.getPayments(historySearch),
        paymentService.getPaymentStats()
      ]);
      setPayments(pRes.data);
      setStats(sRes);
    } catch (error) {
      console.error("Failed to load payment history/stats", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [historySearch]);

  // Fetch invoices when customer is selected
  const handleCustomerSelect = async (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setIsDropdownOpen(false);
    try {
      setLoadingInvoices(true);
      // Fetch only billed invoices for this customer
      const res = await deliveryOrderService.getDeliveryOrders('billed', 1, 100, customer.id);
      const unpaidInvoices = res.data.filter(inv => Number(inv.paid_amount) < Number(inv.total_amount));
      setCustomerInvoices(unpaidInvoices);
      // Select all by default
      setSelectedInvoiceIds(unpaidInvoices.map(inv => inv.id));
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Calculate allocations based on payment amount and selected invoices
  const allocations = useMemo(() => {
    const amount = parseFloat(paymentAmount) || 0;
    let remaining = amount;
    const result: Allocation[] = [];

    // Filter and sort selected invoices
    const selectedInvoices = customerInvoices
      .filter(inv => selectedInvoiceIds.includes(inv.id))
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());

    for (const inv of selectedInvoices) {
      if (remaining <= 0) break;
      const due = Number(inv.total_amount) - Number(inv.paid_amount);
      const allocated = Math.min(remaining, due);
      if (allocated > 0) {
        result.push({
          invoiceId: inv.id,
          orderNo: inv.order_no,
          amount: allocated
        });
        remaining -= allocated;
      }
    }
    return result;
  }, [paymentAmount, selectedInvoiceIds, customerInvoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await customerService.addBulkPayment(selectedCustomer.id, {
        amount: parseFloat(paymentAmount),
        paymentDate,
        method: paymentMethod,
        reference,
        notes,
        selectedInvoiceIds
      });
      alert("Payment recorded successfully!");
      setShowModal(false);
      resetForm();
      loadData(); // Refresh history and stats
    } catch (error) {
      console.error(error);
      alert("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerInvoices([]);
    setSelectedInvoiceIds([]);
    setPaymentAmount('0');
    setReference('');
    setNotes('');
  };

  const totalOutstanding = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payments & Receipts</h2>
          <p className="text-sm text-gray-500 mt-1">Receive payments and allocate to invoices</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-bold"
        >
          <Plus size={20} />
          Record New Payment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
               <Wallet size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Monthly Collection</p>
               <p className="text-xl font-bold text-gray-900">Rs {stats.monthlyCollection.toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Pending Invoices</p>
               <p className="text-xl font-bold text-gray-900">{stats.pendingInvoices} Orders</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
               <AlertCircle size={24} />
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium">Total Outstanding</p>
               <p className="text-xl font-bold text-gray-900">Rs {stats.totalOutstanding.toLocaleString()}</p>
            </div>
         </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] mt-3 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Plus size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Record Customer Payment</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Customer Selection */}
                   <div className="relative">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Customer</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search customer name..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800 transition-all"
                        value={customerSearch}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomer) setSelectedCustomer(null);
                          setIsDropdownOpen(true);
                        }}
                      />
                      {loadingCustomers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="animate-spin text-blue-600" size={18} />
                        </div>
                      )}
                      {selectedCustomer && (
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch('');
                            setCustomerInvoices([]);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {isDropdownOpen && customers.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl mt-2 shadow-2xl z-20 max-h-60 overflow-y-auto divide-y divide-gray-50">
                          {customers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleCustomerSelect(c)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors font-semibold text-gray-700 flex justify-between items-center"
                            >
                              <div>
                                <p>{c.name}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{c.customer_code}</p>
                              </div>
                              <p className="text-[10px] font-black text-blue-600">Rs {Number(c.outstanding_amount).toLocaleString()}</p>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {isDropdownOpen && !loadingCustomers && customers.length === 0 && customerSearch && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl mt-2 p-4 shadow-2xl z-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                        No customers found
                      </div>
                    )}
                  </div>

                  {selectedCustomer && (
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Outstanding</p>
                          <p className="text-xl font-black text-blue-900">Rs {Number(selectedCustomer.outstanding_amount).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Pending Bills</p>
                          <p className="text-xl font-black text-blue-900">{customerInvoices.length}</p>
                       </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Amount (Rs)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" size={18} />
                        <input
                          type="number"
                          required
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-lg text-gray-900"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Date</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="date"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Method</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none bg-white font-bold text-gray-800"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference / Chq #</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800"
                        placeholder="Optional"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Note</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-medium text-gray-700"
                      placeholder="Optional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Invoice Selection & Allocation Preview */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoices to Pay</label>
                    {customerInvoices.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setSelectedInvoiceIds(selectedInvoiceIds.length === customerInvoices.length ? [] : customerInvoices.map(i => i.id))}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        {selectedInvoiceIds.length === customerInvoices.length ? 'DESELECT ALL' : 'SELECT ALL'}
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden flex flex-col max-h-[400px]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {loadingInvoices ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                          <Loader2 className="animate-spin" size={24} />
                          <p className="text-xs font-bold uppercase tracking-widest">Loading Invoices...</p>
                        </div>
                      ) : customerInvoices.length > 0 ? (
                        customerInvoices.map(inv => {
                          const isSelected = selectedInvoiceIds.includes(inv.id);
                          const allocation = allocations.find(a => a.invoiceId === inv.id);
                          const due = Number(inv.total_amount) - Number(inv.paid_amount);
                          
                          return (
                            <div 
                              key={inv.id}
                              onClick={() => {
                                if (isSelected) setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id));
                                else setSelectedInvoiceIds([...selectedInvoiceIds, inv.id]);
                              }}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                isSelected ? 'bg-white border-blue-600 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Plus size={14} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-gray-900 font-mono">#{inv.order_no}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{new Date(inv.order_date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Due: Rs {due.toLocaleString()}</p>
                                  {allocation && (
                                    <p className="text-sm font-black text-green-600">Paying: Rs {allocation.amount.toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                          <p className="text-xs font-bold uppercase tracking-widest">No outstanding invoices</p>
                        </div>
                      )}
                    </div>
                    
                    {allocations.length > 0 && (
                      <div className="p-6 bg-slate-900 text-white">
                        <div className="flex items-center justify-between mb-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocation Summary</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{allocations.length} INVOICES</p>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Total Paying</span>
                              <span className="font-black">Rs {allocations.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
                           </div>
                           {parseFloat(paymentAmount) > allocations.reduce((sum, a) => sum + a.amount, 0) && (
                             <div className="flex justify-between text-sm text-blue-400">
                                <span>Unallocated (Credit)</span>
                                <span className="font-black">Rs {(parseFloat(paymentAmount) - allocations.reduce((sum, a) => sum + a.amount, 0)).toLocaleString()}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCustomer || parseFloat(paymentAmount) <= 0}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      PROCESSING...
                    </>
                  ) : (
                    'CONFIRM PAYMENT RECEIPT'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black tracking-widest hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Recent Payments Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Recent Collection Log</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
               <Search size={16} className="text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Filter history..." 
                 className="bg-transparent border-none outline-none text-xs font-bold text-gray-700"
                 value={historySearch}
                 onChange={(e) => setHistorySearch(e.target.value)}
               />
            </div>
         </div>
         
         <div className="overflow-x-auto">
           {loadingPayments ? (
             <div className="p-20 text-center flex flex-col items-center gap-4">
               <Loader2 className="animate-spin text-blue-600" size={32} />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching Ledger...</p>
             </div>
           ) : payments.length > 0 ? (
             <table className="w-full">
               <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                 <tr>
                   <th className="px-8 py-4 text-left">Date</th>
                   <th className="px-8 py-4 text-left">Customer</th>
                   <th className="px-8 py-4 text-left">Reference</th>
                   <th className="px-8 py-4 text-left">Method</th>
                   <th className="px-8 py-4 text-right">Amount</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {payments.map(p => (
                   <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                     <td className="px-8 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                       {new Date(p.payment_date).toLocaleDateString()}
                     </td>
                     <td className="px-8 py-4 whitespace-nowrap">
                        <p className="text-sm font-black text-gray-800">{p.delivery_order?.customer?.name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold text-blue-600 font-mono">DO: {p.delivery_order?.order_no}</p>
                     </td>
                     <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                        {p.reference_no || '—'}
                     </td>
                     <td className="px-8 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                          {p.mode}
                        </span>
                     </td>
                     <td className="px-8 py-4 whitespace-nowrap text-right">
                        <p className="text-sm font-black text-green-600">Rs {Number(p.amount).toLocaleString()}</p>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <div className="p-20 text-center text-gray-300">
                <Wallet size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">No payments found</p>
                <p className="text-[10px] mt-1 font-bold">Start receiving payments to see them here</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
