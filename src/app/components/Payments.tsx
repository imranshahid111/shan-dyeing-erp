//@ts-nocheck
import { Plus, X, Search, User, Calendar, Wallet, CheckCircle2, AlertCircle, Loader2, Trash2, Eye, Edit2, Paperclip } from 'lucide-react';
import { customerService, CustomerItem } from '../services/customerService';
import { deliveryOrderService, DeliveryOrderItem } from '../services/deliveryOrderService';
import { paymentService, PaymentItem, PaymentStats } from '../services/paymentService';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

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
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState(-1);

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
  const [canDelete, setCanDelete] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // View / Edit States
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<PaymentItem | null>(null);
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<PaymentItem | null>(null);
  const [editAmount, setEditAmount] = useState('0');
  const [editDate, setEditDate] = useState('');
  const [editMethod, setEditMethod] = useState('cash');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [editAttachment, setEditAttachment] = useState<string | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditForm = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      toast.error("File size is too large. Please select a file smaller than 2.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      if (isEditForm) {
        setEditAttachment(base64String);
        setEditAttachmentName(file.name);
      } else {
        setAttachment(base64String);
        setAttachmentName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleViewAttachment = (base64Data: string | null | undefined, fileName: string | null | undefined) => {
    if (!base64Data) return;
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName || 'receipt_document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        paymentService.getPayments(historySearch, currentPage, pageSize),
        paymentService.getPaymentStats()
      ]);
      setPayments(pRes.data);
      setTotalItems(pRes.total);
      setTotalPages(Math.ceil(pRes.total / pageSize) || 1);
      setStats(sRes);
    } catch (error) {
      console.error("Failed to load payment history/stats", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Reset page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [historySearch]);

  useEffect(() => {
    loadData();
  }, [historySearch, currentPage]);

  useEffect(() => {
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
  }, [historySearch]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this payment? This will revert the allocation from the Delivery Order and increase the Customer's outstanding balance!")) return;
    try {
      await paymentService.deletePayment(id);
      toast.success("Payment deleted successfully!");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete payment");
    }
  };

  const handleStartEdit = (p: PaymentItem) => {
    setSelectedPaymentForEdit(p);
    setEditAmount(String(p.amount));
    setEditDate(p.payment_date);
    setEditMethod(p.mode);
    setEditReference(p.reference_no || '');
    setEditNotes(p.notes || '');
    setEditAttachment(p.attachment || null);
    setEditAttachmentName(p.attachment_name || null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForEdit || isEditing) return;

    try {
      setIsEditing(true);
      await paymentService.updatePayment(selectedPaymentForEdit.id, {
        amount: parseFloat(editAmount),
        paymentDate: editDate,
        method: editMethod,
        reference: editReference,
        notes: editNotes,
        attachment: editAttachment,
        attachmentName: editAttachmentName
      });
      toast.success("Payment updated successfully!");
      setSelectedPaymentForEdit(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update payment");
    } finally {
      setIsEditing(false);
    }
  };

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
      // Deselect all by default, so user has to click to auto-fill
      setSelectedInvoiceIds([]);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Selected invoice total due only. Do NOT overwrite paymentAmount here.
  // User can type any amount, then selected invoices will be adjusted against that amount.
  const selectedInvoiceTotalDue = useMemo(() => {
    return selectedInvoiceIds.reduce((sum, id) => {
      const inv = customerInvoices.find(i => i.id === id);
      if (!inv) return sum;
      const due = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));
      return sum + due;
    }, 0);
  }, [selectedInvoiceIds, customerInvoices]);

  const enteredPaymentAmount = Number.parseFloat(paymentAmount) || 0;
  const isPaymentAmountTooHigh =
    selectedInvoiceIds.length > 0 && enteredPaymentAmount > selectedInvoiceTotalDue;

  // Calculate allocations based on typed payment amount and selected invoices.
  // Existing inv.paid_amount is not overwritten; allocation is only the NEW amount to add.
  const allocations = useMemo(() => {
    let remaining = Number.parseFloat(paymentAmount) || 0;
    const result: Allocation[] = [];

    const selectedInvoices = customerInvoices
      .filter(inv => selectedInvoiceIds.includes(inv.id))
      .sort((a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());

    for (const inv of selectedInvoices) {
      if (remaining <= 0) break;

      const due = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));
      const allocated = Math.min(remaining, due);

      if (allocated > 0) {
        result.push({
          invoiceId: inv.id,
          orderNo: inv.order_no,
          amount: Number(allocated.toFixed(2))
        });
        remaining -= allocated;
      }
    }

    return result;
  }, [paymentAmount, selectedInvoiceIds, customerInvoices]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingSelectedDue = Math.max(0, selectedInvoiceTotalDue - allocatedTotal);

  useEffect(() => {
    if (selectedInvoiceIds.length === 0) {
      setPaymentAmount('');
    } else {
      const currentAmt = Number.parseFloat(paymentAmount) || 0;
      let maxLimit = selectedInvoiceTotalDue;
      if (paymentMethod === 'advance') {
        maxLimit = Math.min(selectedInvoiceTotalDue, Number(selectedCustomer?.advance_balance || 0));
        if (maxLimit > 0) {
          setPaymentAmount(maxLimit.toString());
        }
      } else {
        if (currentAmt > maxLimit) {
          setPaymentAmount(maxLimit.toString());
        }
      }
    }
  }, [selectedInvoiceTotalDue, selectedInvoiceIds.length, paymentMethod, selectedCustomer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || isSubmitting) return;

    const amount = Number.parseFloat(paymentAmount) || 0;

    if (selectedInvoiceIds.length === 0) {
      toast.error("Please select at least one invoice.");
      return;
    }

    if (amount <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }

    if (amount > selectedInvoiceTotalDue) {
      toast.error(`Payment amount cannot be greater than selected invoices due: Rs ${selectedInvoiceTotalDue.toLocaleString()}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await customerService.addBulkPayment(selectedCustomer.id, {
        amount,
        paymentDate,
        method: paymentMethod,
        reference,
        notes,
        selectedInvoiceIds,
        allocations,
        attachment,
        attachmentName
      });
      toast.success("Payment recorded successfully!");
      setShowModal(false);
      resetForm();
      loadData(); // Refresh history and stats
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment");
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
    setAttachment(null);
    setAttachmentName(null);
  };

  const totalOutstanding = customerInvoices.reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);

  return (
    <div className="space-y-6 min-h-[calc(100vh-140px)] flex flex-col">
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
      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
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

            <form 
              onSubmit={handleSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLElement;
                  if (target.tagName.toLowerCase() === 'textarea') return;
                  if (target.tagName.toLowerCase() === 'button') return;
                  
                  e.preventDefault();
                  
                  const form = e.currentTarget;
                  const focusableElements = Array.from(
                    form.querySelectorAll<HTMLElement>(
                      'input:not([type="hidden"]):not([disabled]):not(.hidden), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
                    )
                  );
                  
                  const index = focusableElements.indexOf(target);
                  if (index > -1 && index < focusableElements.length - 1) {
                    focusableElements[index + 1].focus();
                  }
                }
              }}
              className="flex-1 overflow-y-auto p-8"
            >
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
                          setFocusedCustomerIndex(-1);
                        }}
                        onKeyDown={(e) => {
                          if (!isDropdownOpen) return;
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setFocusedCustomerIndex(prev => (prev < customers.length - 1 ? prev + 1 : prev));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setFocusedCustomerIndex(prev => (prev > 0 ? prev - 1 : prev));
                          } else if (e.key === 'Enter') {
                            if (focusedCustomerIndex >= 0 && customers[focusedCustomerIndex]) {
                              e.preventDefault();
                              e.stopPropagation(); // prevent form from shifting focus automatically
                              handleCustomerSelect(customers[focusedCustomerIndex]);
                              // manually focus the amount field
                              setTimeout(() => {
                                const form = e.currentTarget.closest('form');
                                if (form) {
                                  const focusable = Array.from(form.querySelectorAll<HTMLElement>('input:not([type="hidden"]):not([disabled]):not(.hidden)'));
                                  const amountInput = focusable[1]; 
                                  if (amountInput) amountInput.focus();
                                }
                              }, 10);
                            }
                          }
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
                          {customers.map((c, index) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleCustomerSelect(c)}
                              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors font-semibold text-gray-700 flex justify-between items-center ${focusedCustomerIndex === index ? 'bg-blue-100' : ''}`}
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
                        <p className="text-xl font-black text-blue-900">Rs {totalOutstanding.toLocaleString()}</p>
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
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-600 font-black text-xs">PKR</span>
                        <input
                          type="number"
                          required
                          step="0.01"
                          disabled={selectedInvoiceIds.length === 0}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-lg text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                          value={paymentAmount}
                          max={
                            paymentMethod === 'advance'
                              ? Math.min(selectedInvoiceTotalDue, Number(selectedCustomer?.advance_balance || 0))
                              : selectedInvoiceTotalDue || undefined
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            let maxLimit = selectedInvoiceTotalDue;
                            if (paymentMethod === 'advance') {
                               maxLimit = Math.min(selectedInvoiceTotalDue, Number(selectedCustomer?.advance_balance || 0));
                            }
                            if (Number(val) > maxLimit) {
                               toast.error(paymentMethod === 'advance' ? `Amount cannot exceed available Advance Balance (Rs ${maxLimit.toLocaleString()})` : `Amount cannot exceed Rs ${maxLimit.toLocaleString()}`);
                               setPaymentAmount(maxLimit.toString());
                            } else {
                               setPaymentAmount(val);
                            }
                          }}
                          placeholder={selectedInvoiceIds.length === 0 ? "Select invoice first" : "0"}
                        />
                        {selectedInvoiceIds.length === 0 && (
                          <p className="mt-1 text-[10px] font-bold text-gray-400">
                            Please select an invoice to enter amount.
                          </p>
                        )}
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
                        onChange={(e) => {
                          const newMethod = e.target.value;
                          setPaymentMethod(newMethod);
                          if (newMethod === 'advance' && selectedCustomer) {
                            const available = Number(selectedCustomer.advance_balance || 0);
                            const populateAmount = Math.min(selectedInvoiceTotalDue, available);
                            if (populateAmount > 0) {
                              setPaymentAmount(populateAmount.toString());
                            }
                          }
                        }}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online</option>
                        {selectedCustomer && Number(selectedCustomer.advance_balance || 0) > 0 && (
                          <option value="advance">
                            Advance Balance (Available: Rs {Number(selectedCustomer.advance_balance).toLocaleString()})
                          </option>
                        )}
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

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Receipt Document / Photo</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-all font-bold text-xs text-gray-600">
                        <Plus size={16} />
                        Choose File
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, false)}
                        />
                      </label>
                      {attachmentName ? (
                        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl font-bold">
                          <span>{attachmentName}</span>
                          <button type="button" onClick={() => { setAttachment(null); setAttachmentName(null); }} className="hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">No file selected (Image or PDF)</span>
                      )}
                    </div>
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
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'bg-white border-blue-600 shadow-sm' : 'bg-transparent border-transparent hover:bg-gray-100'
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
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
                            <span className="font-black">Rs {allocatedTotal.toLocaleString()}</span>
                          </div>
                          {remainingSelectedDue > 0 && (
                            <div className="flex justify-between text-sm text-blue-400">
                              <span>Remaining Due</span>
                              <span className="font-black">Rs {remainingSelectedDue.toLocaleString()}</span>
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
                  disabled={
                    isSubmitting ||
                    !selectedCustomer ||
                    selectedInvoiceIds.length === 0 ||
                    enteredPaymentAmount <= 0 ||
                    isPaymentAmountTooHigh
                  }
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
        </div>,
        document.body
      )}

      {/* Recent Payments Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
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

        <div className="overflow-x-auto flex-1">
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
                  <th className="px-8 py-4 text-center">Actions</th>
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
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 font-semibold">{p.reference_no || '—'}</span>
                        {p.attachment && (
                          <button
                            onClick={() => handleViewAttachment(p.attachment, p.attachment_name || 'receipt')}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                            title={`Download Attachment: ${p.attachment_name || 'File'}`}
                          >
                            <Paperclip size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-black uppercase text-gray-600 tracking-wider">
                        {p.mode}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right">
                      <p className="text-sm font-black text-green-600">Rs {Number(p.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedPaymentForView(p)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                          title="View Payment"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-1.5 rounded-lg transition-colors"
                          title="Edit Payment"
                        >
                          <Edit2 size={15} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
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

        {/* Pagination Footer */}
        {!loadingPayments && totalItems > 0 && (
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

      {/* View Payment Modal */}
      {selectedPaymentForView && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Eye size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Payment Details</h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForView(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer</span>
                <p className="font-bold text-gray-800 text-lg">{selectedPaymentForView.delivery_order?.customer?.name || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">DO Number</span>
                  <p className="font-mono font-bold text-blue-600 text-sm">#{selectedPaymentForView.delivery_order?.order_no || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Amount Paid</span>
                  <p className="font-black text-green-600 text-lg">Rs {Number(selectedPaymentForView.amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Date</span>
                  <p className="font-bold text-gray-700">{new Date(selectedPaymentForView.payment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Method</span>
                  <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-[10px] font-black uppercase text-gray-600 tracking-wider inline-block mt-1">
                    {selectedPaymentForView.mode}
                  </span>
                </div>
              </div>

              {selectedPaymentForView.reference_no && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Reference / Cheque #</span>
                  <p className="text-gray-700 font-semibold">{selectedPaymentForView.reference_no}</p>
                </div>
              )}

              {selectedPaymentForView.notes && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Notes</span>
                  <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedPaymentForView.notes}</p>
                </div>
              )}

              {selectedPaymentForView.attachment && (
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Receipt Document / Photo</span>
                  <div className="flex flex-col gap-3">
                    {selectedPaymentForView.attachment.startsWith('data:image/') ? (
                      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm max-h-[200px] flex items-center justify-center bg-gray-50">
                        <img
                          src={selectedPaymentForView.attachment}
                          alt="Receipt Attachment"
                          className="max-w-full max-h-[200px] object-contain cursor-zoom-in"
                          onClick={() => handleViewAttachment(selectedPaymentForView.attachment, selectedPaymentForView.attachment_name || 'receipt')}
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleViewAttachment(selectedPaymentForView.attachment, selectedPaymentForView.attachment_name || 'receipt')}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition-all text-xs"
                    >
                      <Plus size={16} />
                      Download/View Attachment ({selectedPaymentForView.attachment_name || 'File'})
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedPaymentForView(null)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Payment Modal */}
      {selectedPaymentForEdit && createPortal(
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200" style={{ maxHeight: '85vh' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Edit2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Edit Payment</h3>
              </div>
              <button
                onClick={() => setSelectedPaymentForEdit(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-6 overflow-y-auto flex-1 pr-1">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Customer / DO</span>
                  <p className="font-bold text-gray-800">{selectedPaymentForEdit.delivery_order?.customer?.name || 'N/A'}</p>
                  <p className="font-mono text-xs text-blue-600 font-bold">DO #{selectedPaymentForEdit.delivery_order?.order_no || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount Paid (Rs)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-gray-900"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-bold text-gray-800"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Method</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none bg-white font-bold text-gray-800"
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value)}
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
                      value={editReference}
                      onChange={(e) => setEditReference(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Notes</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-medium text-gray-700"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Receipt Document / Photo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-all font-bold text-xs text-gray-600">
                      <Plus size={16} />
                      Replace File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, true)}
                      />
                    </label>
                    {editAttachmentName ? (
                      <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl font-bold">
                        <span>{editAttachmentName}</span>
                        <button type="button" onClick={() => { setEditAttachment(null); setEditAttachmentName(null); }} className="hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium">No file attached</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100 bg-white">
                <button
                  type="submit"
                  disabled={isEditing || parseFloat(editAmount) <= 0}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-2xl font-black tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      SAVING...
                    </>
                  ) : (
                    'SAVE CHANGES'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentForEdit(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-black tracking-widest hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
