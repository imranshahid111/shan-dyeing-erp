import { useState } from 'react';
import { Download, FileText, Filter } from 'lucide-react';

const ledgerData = [
  { date: '2026-04-01', description: 'Invoice INV-4501', debit: 45000, credit: 0, balance: 45000 },
  { date: '2026-04-05', description: 'Payment Received', debit: 0, credit: 30000, balance: 15000 },
  { date: '2026-04-10', description: 'Invoice INV-4521', debit: 52000, credit: 0, balance: 67000 },
  { date: '2026-04-15', description: 'Payment Received', debit: 0, credit: 45000, balance: 22000 },
];

const outstandingData = [
  { customer: 'ABC Textiles', totalBilled: 97000, totalPaid: 75000, outstanding: 22000 },
  { customer: 'XYZ Industries', totalBilled: 68500, totalPaid: 60000, outstanding: 8500 },
  { customer: 'Global Fabrics', totalBilled: 125000, totalPaid: 65000, outstanding: 60000 },
];

const stockData = [
  { lotNo: 'GL-2045', quality: 'Cotton 60s', grayStock: 250, readyStock: 240, pending: 10 },
  { lotNo: 'GL-2046', quality: 'Polyester Blend', grayStock: 180, readyStock: 175, pending: 5 },
  { lotNo: 'GL-2047', quality: 'Silk Mix', grayStock: 320, readyStock: 0, pending: 320 },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'outstanding' | 'stock'>('ledger');
  const [selectedCustomer, setSelectedCustomer] = useState('ABC Textiles');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-6 py-3 rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Customer Ledger
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`px-6 py-3 rounded-xl transition-all ${
            activeTab === 'outstanding'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Outstanding Report
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-3 rounded-xl transition-all ${
            activeTab === 'stock'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Stock Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="2026-04-01"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="2026-04-18"
              />
            </div>
            {activeTab === 'ledger' && (
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option>ABC Textiles</option>
                  <option>XYZ Industries</option>
                  <option>Global Fabrics</option>
                </select>
              </div>
            )}
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mt-5">
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Customer Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedCustomer}</h3>
                <p className="text-sm text-gray-500 mt-1">Account Ledger</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className="text-2xl font-bold text-red-600">₹22,000</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Debit
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credit
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ledgerData.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                      {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-800">
                      ₹{entry.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outstanding Report */}
      {activeTab === 'outstanding' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Outstanding Summary</h3>
            <p className="text-sm text-gray-500 mt-1">Customer-wise pending dues</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Billed
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {outstandingData.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                      {entry.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                      ₹{entry.totalBilled.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      ₹{entry.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-red-600">
                      ₹{entry.outstanding.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-6 py-4 font-semibold text-gray-800">Total</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    ₹{outstandingData.reduce((sum, e) => sum + e.totalBilled, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">
                    ₹{outstandingData.reduce((sum, e) => sum + e.totalPaid, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    ₹{outstandingData.reduce((sum, e) => sum + e.outstanding, 0).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Stock Report */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Gray Stock</p>
              <p className="text-3xl font-bold">750 gaz</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Ready Stock</p>
              <p className="text-3xl font-bold">415 gaz</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">In Processing</p>
              <p className="text-3xl font-bold">335 gaz</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Lot-wise Stock Details</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lot No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gray Stock
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ready Stock
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stockData.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                        {entry.lotNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.quality}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600">
                        {entry.grayStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                        {entry.readyStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-orange-600">
                        {entry.pending}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            entry.pending === 0
                              ? 'bg-green-100 text-green-700'
                              : entry.readyStock > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {entry.pending === 0
                            ? 'Complete'
                            : entry.readyStock > 0
                            ? 'In Progress'
                            : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
