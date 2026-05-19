import { useEffect, useState, useMemo } from 'react';
import { Download, FileText, Filter, Loader2 } from 'lucide-react';
import { dashboardService, LedgerEntry, OutstandingEntry, StockEntry, QualityStockEntry } from '../services/dashboardService';
import { customerService, CustomerItem } from '../services/customerService';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'outstanding' | 'stock'>('ledger');
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState('2026-05-01');
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [outstandingData, setOutstandingData] = useState<OutstandingEntry[]>([]);
  const [stockData, setStockData] = useState<StockEntry[]>([]);
  const [qualityStockData, setQualityStockData] = useState<QualityStockEntry[]>([]);
  const [stockView, setStockView] = useState<'lots' | 'quality'>('lots');
  const [stockUnit, setStockUnit] = useState<'gaz' | 'meters'>('gaz');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await customerService.getCustomers('', 1, 1000);
        setCustomers(res.data);
        if (res.data.length > 0) {
          setSelectedCustomerId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'ledger' && selectedCustomerId) {
          const data = await dashboardService.getLedger({ 
            customerId: selectedCustomerId,
            fromDate,
            toDate
          });
          setLedgerData(data);
        } else if (activeTab === 'outstanding') {
          const data = await dashboardService.getOutstanding();
          setOutstandingData(data);
        } else if (activeTab === 'stock') {
          const [lotData, qualData] = await Promise.all([
            dashboardService.getStock(),
            dashboardService.getQualityStock(),
          ]);
          setStockData(lotData);
          setQualityStockData(qualData);
        }
      } catch (err) {
        console.error('Failed to fetch report data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, selectedCustomerId, fromDate, toDate]);

  const selectedCustomerName = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId)?.name || 'Select Customer';
  }, [customers, selectedCustomerId]);

  const currentBalance = useMemo(() => {
    if (ledgerData.length === 0) return 0;
    return ledgerData[ledgerData.length - 1].balance;
  }, [ledgerData]);

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
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {activeTab === 'ledger' && (
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Customer</label>
                <select
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors mt-5">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
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
                <h3 className="text-lg font-semibold text-gray-800">{selectedCustomerName}</h3>
                <p className="text-sm text-gray-500 mt-1">Account Ledger</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Balance</p>
                <p className={`text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {Math.abs(currentBalance).toLocaleString()} {currentBalance > 0 ? '(Dr)' : '(Cr)'}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Debit</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ledgerData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No records found for this period.</td>
                  </tr>
                )}
                {ledgerData.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{entry.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                      {entry.debit > 0 ? `Rs ${entry.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      {entry.credit > 0 ? `Rs ${entry.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-800">
                      Rs {entry.balance.toLocaleString()}
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
                      Rs {entry.totalBilled.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">
                      Rs {entry.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-red-600">
                      Rs {entry.outstanding.toLocaleString()}
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
                    Rs {outstandingData.reduce((sum, e) => sum + e.totalBilled, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">
                    Rs {outstandingData.reduce((sum, e) => sum + e.totalPaid, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    Rs {outstandingData.reduce((sum, e) => sum + e.outstanding, 0).toLocaleString()}
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Gray Stock</p>
              <p className="text-2xl font-bold">
                {stockUnit === 'gaz'
                  ? `${stockData.reduce((s, e) => s + e.grayStock, 0).toLocaleString()} Gaz`
                  : `${stockData.reduce((s, e) => s + e.grayStockMeters, 0).toLocaleString()} M`}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">Total Ready Stock</p>
              <p className="text-2xl font-bold">
                {stockUnit === 'gaz'
                  ? `${stockData.reduce((s, e) => s + e.readyStock, 0).toLocaleString()} Gaz`
                  : `${stockData.reduce((s, e) => s + e.readyStockMeters, 0).toLocaleString()} M`}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-sm opacity-90 mb-1">In Processing</p>
              <p className="text-2xl font-bold">
                {stockUnit === 'gaz'
                  ? `${stockData.reduce((s, e) => s + e.pending, 0).toLocaleString()} Gaz`
                  : `${stockData.reduce((s, e) => s + e.pendingMeters, 0).toLocaleString()} M`}
              </p>
            </div>
          </div>

          {/* View Controls */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">View:</span>
              <button
                onClick={() => setStockView('lots')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stockView === 'lots' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lot-wise
              </button>
              <button
                onClick={() => setStockView('quality')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stockView === 'quality' ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quality-wise
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit:</span>
              <button
                onClick={() => setStockUnit('gaz')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stockUnit === 'gaz' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Gaz (Yards)
              </button>
              <button
                onClick={() => setStockUnit('meters')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  stockUnit === 'meters' ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Meters
              </button>
            </div>
          </div>

          {/* LOT-WISE TABLE */}
          {stockView === 'lots' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Lot-wise Stock Details</h3>
                  <p className="text-xs text-gray-400 mt-0.5">All values in {stockUnit === 'gaz' ? 'Gaz (Yards)' : 'Meters'}</p>
                </div>
                <span className="text-xs font-bold text-gray-400">{stockData.length} Lots</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lot No</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gray Stock</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ready Stock</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockData.length === 0 && !loading && (
                      <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No stock data found.</td></tr>
                    )}
                    {stockData.map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-800">{entry.lotNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-bold">{entry.quality}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-semibold">
                          {stockUnit === 'gaz'
                            ? `${Number(entry.totalGazana).toLocaleString()} Gaz`
                            : `${Number(entry.totalMeters).toLocaleString()} M`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-blue-600 font-semibold">
                          {stockUnit === 'gaz'
                            ? `${entry.grayStock.toLocaleString()} Gaz`
                            : `${entry.grayStockMeters.toLocaleString()} M`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-semibold">
                          {stockUnit === 'gaz'
                            ? `${entry.readyStock.toLocaleString()} Gaz`
                            : `${entry.readyStockMeters.toLocaleString()} M`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-orange-600 font-semibold">
                          {stockUnit === 'gaz'
                            ? `${entry.pending.toLocaleString()} Gaz`
                            : `${entry.pendingMeters.toLocaleString()} M`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            entry.pending === 0
                              ? 'bg-green-100 text-green-700'
                              : entry.readyStock > 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {entry.pending === 0 ? 'Complete' : entry.readyStock > 0 ? 'In Progress' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* QUALITY-WISE TABLE */}
          {stockView === 'quality' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Quality-wise Stock Summary</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Aggregated ready stock grouped by fabric quality — in {stockUnit === 'gaz' ? 'Gaz (Yards)' : 'Meters'}</p>
                </div>
                <span className="text-xs font-bold text-gray-400">{qualityStockData.length} Qualities</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lots</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ready Stock</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ready %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {qualityStockData.length === 0 && !loading && (
                      <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No quality data found.</td></tr>
                    )}
                    {qualityStockData.map((entry, index) => {
                      const readyPct = entry.totalGaz > 0 ? Math.round((entry.readyGaz / entry.totalGaz) * 100) : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold">{entry.quality}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-bold">{entry.lotCount} Lots</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-700">
                            {stockUnit === 'gaz'
                              ? `${entry.totalGaz.toLocaleString()} Gaz`
                              : `${entry.totalMeters.toLocaleString()} M`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-green-600">
                            {stockUnit === 'gaz'
                              ? `${entry.readyGaz.toLocaleString()} Gaz`
                              : `${entry.readyMeters.toLocaleString()} M`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-orange-500">
                            {stockUnit === 'gaz'
                              ? `${entry.pendingGaz.toLocaleString()} Gaz`
                              : `${entry.pendingMeters.toLocaleString()} M`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-green-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${readyPct}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-600">{readyPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td className="px-6 py-4 font-bold text-gray-800">Total</td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">{qualityStockData.reduce((s, e) => s + e.lotCount, 0)} Lots</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-700">
                        {stockUnit === 'gaz'
                          ? `${qualityStockData.reduce((s, e) => s + e.totalGaz, 0).toLocaleString()} Gaz`
                          : `${qualityStockData.reduce((s, e) => s + e.totalMeters, 0).toLocaleString()} M`}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {stockUnit === 'gaz'
                          ? `${qualityStockData.reduce((s, e) => s + e.readyGaz, 0).toLocaleString()} Gaz`
                          : `${qualityStockData.reduce((s, e) => s + e.readyMeters, 0).toLocaleString()} M`}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-orange-500">
                        {stockUnit === 'gaz'
                          ? `${qualityStockData.reduce((s, e) => s + e.pendingGaz, 0).toLocaleString()} Gaz`
                          : `${qualityStockData.reduce((s, e) => s + e.pendingMeters, 0).toLocaleString()} M`}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
