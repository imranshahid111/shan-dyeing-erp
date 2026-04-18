import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  customer: string;
  invoiceNo: string;
  amount: number;
  method: string;
}

const mockPayments: Payment[] = [
  {
    id: '1',
    date: '2026-04-15',
    customer: 'ABC Textiles',
    invoiceNo: 'INV-4521',
    amount: 45000,
    method: 'Bank Transfer',
  },
  {
    id: '2',
    date: '2026-04-16',
    customer: 'XYZ Industries',
    invoiceNo: 'INV-4522',
    amount: 30000,
    method: 'Cash',
  },
];

const mockCustomers = [
  { name: 'ABC Textiles', invoices: [{ no: 'INV-4521', amount: 52000, paid: 45000 }] },
  { name: 'XYZ Industries', invoices: [{ no: 'INV-4522', amount: 38500, paid: 30000 }] },
];

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const customer = mockCustomers.find((c) => c.name === selectedCustomer);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Payment Records</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Payment
        </button>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Add Payment</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Customer</label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Select customer...</option>
                  {mockCustomers.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {customer && (
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Invoices</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {customer.invoices.map((inv) => (
                      <label
                        key={inv.no}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={selectedInvoices.includes(inv.no)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices([...selectedInvoices, inv.no]);
                            } else {
                              setSelectedInvoices(selectedInvoices.filter((i) => i !== inv.no));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{inv.no}</p>
                          <p className="text-xs text-gray-500">
                            Due: ₹{(inv.amount - inv.paid).toLocaleString()}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-600 mb-2">Amount Paid</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Payment Method</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>Online Payment</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Payment Date</label>
                <input
                  type="date"
                  defaultValue="2026-04-18"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Reference / Transaction ID</label>
                <input
                  type="text"
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Save Payment
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{payment.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                    {payment.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{payment.invoiceNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-green-600">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {payment.method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Received (This Month)</p>
          <p className="text-3xl font-bold">₹75,000</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Outstanding</p>
          <p className="text-3xl font-bold">₹90,500</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-sm opacity-90 mb-1">Total Transactions</p>
          <p className="text-3xl font-bold">{payments.length}</p>
        </div>
      </div>
    </div>
  );
}
