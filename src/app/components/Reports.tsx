import { useEffect, useState, useMemo } from 'react';
import { Download, FileText, Filter, Loader2, Printer, List, CheckSquare, Package, DollarSign } from 'lucide-react';
import { dashboardService, LedgerEntry, OutstandingEntry, StockEntry, QualityStockEntry, PaymentReportEntry, InvoiceReportEntry } from '../services/dashboardService';
import { customerService, CustomerItem } from '../services/customerService';
import * as XLSX from 'xlsx';
import React from 'react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'ledger' | 'outstanding' | 'stock' | 'payments' | 'invoices'>('ledger');
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [ledgerData, setLedgerData] = useState<LedgerEntry[]>([]);
  const [outstandingData, setOutstandingData] = useState<OutstandingEntry[]>([]);
  const [stockData, setStockData] = useState<StockEntry[]>([]);
  const [qualityStockData, setQualityStockData] = useState<QualityStockEntry[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentReportEntry[]>([]);
  const [invoicesData, setInvoicesData] = useState<InvoiceReportEntry[]>([]);

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
          const data = await dashboardService.getLedger({ customerId: selectedCustomerId, fromDate, toDate });
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
        } else if (activeTab === 'payments') {
          const data = await dashboardService.getPaymentsReport({ fromDate, toDate });
          setPaymentsData(data);
        } else if (activeTab === 'invoices') {
          const data = await dashboardService.getInvoicesReport({ fromDate, toDate });
          setInvoicesData(data);
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

  const exportToExcel = () => {
    let ws;
    let fileName = `${activeTab}_report.xlsx`;
    
    if (activeTab === 'ledger') {
      ws = XLSX.utils.json_to_sheet(ledgerData.map(e => ({
        Date: e.date,
        Description: e.description,
        Debit: e.debit,
        Credit: e.credit,
        Balance: e.balance
      })));
      fileName = `Ledger_${selectedCustomerName}_${fromDate}_to_${toDate}.xlsx`;
    } else if (activeTab === 'outstanding') {
      ws = XLSX.utils.json_to_sheet(outstandingData.map(e => ({
        Customer: e.customer,
        'Total Billed': e.totalBilled,
        'Total Paid': e.totalPaid,
        Outstanding: e.outstanding
      })));
      fileName = `Outstanding_Report.xlsx`;
    } else if (activeTab === 'stock') {
      if (stockView === 'lots') {
        ws = XLSX.utils.json_to_sheet(stockData.map(e => ({
          'Lot No': e.lotNo,
          Quality: e.quality,
          [`Total Received (${stockUnit})`]: stockUnit === 'gaz' ? e.totalGazana : e.totalMeters,
          [`Gray Stock (${stockUnit})`]: stockUnit === 'gaz' ? e.grayStock : e.grayStockMeters,
          [`Ready Stock (${stockUnit})`]: stockUnit === 'gaz' ? e.readyStock : e.readyStockMeters,
          [`Pending (${stockUnit})`]: stockUnit === 'gaz' ? e.pending : e.pendingMeters,
        })));
        fileName = `Stock_LotWise_${stockUnit}.xlsx`;
      } else {
        ws = XLSX.utils.json_to_sheet(qualityStockData.map(e => ({
          Quality: e.quality,
          Lots: e.lotCount,
          [`Total Received (${stockUnit})`]: stockUnit === 'gaz' ? e.totalGaz : e.totalMeters,
          [`Ready Stock (${stockUnit})`]: stockUnit === 'gaz' ? e.readyGaz : e.readyMeters,
          [`Pending (${stockUnit})`]: stockUnit === 'gaz' ? e.pendingGaz : e.pendingMeters,
        })));
        fileName = `Stock_QualityWise_${stockUnit}.xlsx`;
      }
    } else if (activeTab === 'payments') {
      ws = XLSX.utils.json_to_sheet(paymentsData.map(e => ({
        Date: e.date,
        Customer: e.customer,
        'Invoice No': e.invoiceNo,
        Method: e.method,
        Reference: e.reference,
        Amount: e.amount
      })));
      fileName = `Payments_${fromDate}_to_${toDate}.xlsx`;
    } else if (activeTab === 'invoices') {
      ws = XLSX.utils.json_to_sheet(invoicesData.map(e => ({
        Date: e.date,
        'Invoice No': e.invoiceNo,
        Customer: e.customer,
        'Lot No': e.lotNo,
        'Ready Stock': e.readyStock,
        Unit: e.unit,
        Rate: e.rate,
        Amount: e.amount
      })));
      fileName = `Invoices_${fromDate}_to_${toDate}.xlsx`;
    }

    if (ws) {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, fileName);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:pb-0">
      
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Advanced Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Export customized reports to Excel or PDF</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20 font-bold"
          >
            <Printer size={18} />
            Print PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 font-bold"
          >
            <Download size={18} />
            Excel Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2 print:hidden">
        {[
          { id: 'ledger', label: 'Customer Ledger', icon: List },
          { id: 'outstanding', label: 'Outstanding Dues', icon: DollarSign },
          { id: 'stock', label: 'Stock Report', icon: Package },
          { id: 'invoices', label: 'Invoices Log', icon: FileText },
          { id: 'payments', label: 'Payments Log', icon: CheckSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-semibold text-sm flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== 'outstanding' && activeTab !== 'stock' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 print:hidden">
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-gray-400" />
            <div className="flex items-center gap-6 flex-1 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">From Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">To Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              {activeTab === 'ledger' && (
                <div className="flex-1 min-w-[250px]">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Customer</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:outline-none focus:border-blue-500 font-bold text-gray-700"
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-black pb-6">
        <h1 className="text-3xl font-black uppercase tracking-widest mb-2">Shan Dyeing ERP</h1>
        <h2 className="text-xl font-bold text-gray-700 uppercase tracking-widest">
          {activeTab === 'ledger' && `Customer Ledger: ${selectedCustomerName}`}
          {activeTab === 'outstanding' && 'Outstanding Summary Report'}
          {activeTab === 'stock' && `Stock Summary Report (${stockView})`}
          {activeTab === 'invoices' && 'Invoices Log'}
          {activeTab === 'payments' && 'Payments Receipt Log'}
        </h2>
        {activeTab !== 'outstanding' && activeTab !== 'stock' && (
          <p className="text-sm font-bold text-gray-500 mt-2">Period: {fromDate} to {toDate}</p>
        )}
      </div>

      {/* Report Tables Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none report-container relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
             <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {/* 1. Customer Ledger */}
        {activeTab === 'ledger' && (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between print:hidden">
              <div>
                <h3 className="text-lg font-black text-gray-800">{selectedCustomerName}</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">Account Ledger</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Balance</p>
                <p className={`text-2xl font-black ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Rs {Math.abs(currentBalance).toLocaleString()} {currentBalance > 0 ? '(Dr)' : '(Cr)'}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Description</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Debit</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Credit</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {ledgerData.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-semibold">No records found.</td></tr>
                  )}
                  {ledgerData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600 font-semibold">{entry.date}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-800 font-bold">{entry.description}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-red-600 font-bold">
                        {entry.debit > 0 ? `Rs ${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-green-600 font-bold">
                        {entry.credit > 0 ? `Rs ${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-black text-gray-900">
                        Rs {entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 2. Outstanding Report */}
        {activeTab === 'outstanding' && (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 print:hidden">
              <h3 className="text-lg font-black text-gray-800">Outstanding Summary</h3>
              <p className="text-sm text-gray-500 font-semibold mt-0.5">Customer-wise pending dues</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Total Billed</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Total Paid</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {outstandingData.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-semibold">No pending dues found.</td></tr>
                  )}
                  {outstandingData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-800">{entry.customer}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-gray-600 font-semibold">
                        Rs {entry.totalBilled.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-green-600 font-semibold">
                        Rs {entry.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-black text-red-600">
                        Rs {entry.outstanding.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 print:bg-gray-200">
                  <tr>
                    <td className="px-6 py-4 font-black text-gray-800 uppercase tracking-widest">Total</td>
                    <td className="px-6 py-4 text-right font-black text-gray-800">
                      Rs {outstandingData.reduce((sum, e) => sum + e.totalBilled, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-600">
                      Rs {outstandingData.reduce((sum, e) => sum + e.totalPaid, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600 text-lg">
                      Rs {outstandingData.reduce((sum, e) => sum + e.outstanding, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* 3. Invoices Log */}
        {activeTab === 'invoices' && (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 print:hidden">
              <h3 className="text-lg font-black text-gray-800">Delivery Orders / Invoices</h3>
              <p className="text-sm text-gray-500 font-semibold mt-0.5">Billed orders within period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Invoice No</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Lot No</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Ready Stock</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Rate</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {invoicesData.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 font-semibold">No invoices found.</td></tr>
                  )}
                  {invoicesData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600 font-semibold">{entry.date}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-900">{entry.invoiceNo}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-700">{entry.customer}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-mono text-gray-500">{entry.lotNo}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-semibold text-blue-600">
                        {entry.readyStock} {entry.unit}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-gray-500 font-semibold">
                        Rs {entry.rate} / {entry.rateUnit === 'yard' ? 'Gaz' : 'Mtr'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-black text-green-600">
                        Rs {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 print:bg-gray-200">
                  <tr>
                    <td colSpan={6} className="px-6 py-4 font-black text-gray-800 uppercase tracking-widest text-right">Total Amount</td>
                    <td className="px-6 py-4 text-right font-black text-green-600 text-lg">
                      Rs {invoicesData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* 4. Payments Log */}
        {activeTab === 'payments' && (
          <>
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 print:hidden">
              <h3 className="text-lg font-black text-gray-800">Payments Log</h3>
              <p className="text-sm text-gray-500 font-semibold mt-0.5">Receipts within period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Invoice Ref</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Method</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Cheque/Ref</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {paymentsData.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold">No payments found.</td></tr>
                  )}
                  {paymentsData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-gray-600 font-semibold">{entry.date}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-800">{entry.customer}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-500">{entry.invoiceNo}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-gray-600 uppercase text-xs">{entry.method}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-medium text-gray-500">{entry.reference}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right font-black text-green-600">
                        Rs {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300 print:bg-gray-200">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 font-black text-gray-800 uppercase tracking-widest text-right">Total Collected</td>
                    <td className="px-6 py-4 text-right font-black text-green-600 text-lg">
                      Rs {paymentsData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* 5. Stock Report */}
        {activeTab === 'stock' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setStockView('lots')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    stockView === 'lots' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Lot-wise Grid
                </button>
                <button
                  onClick={() => setStockView('quality')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    stockView === 'quality' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Quality-wise Grid
                </button>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setStockUnit('gaz')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    stockUnit === 'gaz' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Yards (Gaz)
                </button>
                <button
                  onClick={() => setStockUnit('meters')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    stockUnit === 'meters' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Meters
                </button>
              </div>
            </div>

            {stockView === 'lots' && (
              <table className="w-full text-sm border-t border-gray-100 print:border-t-0">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Lot No</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Quality</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Received</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Gray Stock</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Ready Stock</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {stockData.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold">No stock found.</td></tr>
                  )}
                  {stockData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap font-mono font-bold text-gray-800">{entry.lotNo}</td>
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-purple-700">{entry.quality}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-gray-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.totalGazana.toLocaleString() : entry.totalMeters.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-blue-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.grayStock.toLocaleString() : entry.grayStockMeters.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-green-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.readyStock.toLocaleString() : entry.readyStockMeters.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-orange-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.pending.toLocaleString() : entry.pendingMeters.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {stockView === 'quality' && (
              <table className="w-full text-sm border-t border-gray-100 print:border-t-0">
                <thead className="bg-gray-100/50 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-widest text-[10px]">Quality</th>
                    <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-widest text-[10px]">Lots</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Received</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Ready Stock</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-widest text-[10px]">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                  {qualityStockData.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-semibold">No stock found.</td></tr>
                  )}
                  {qualityStockData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap font-bold text-purple-700">{entry.quality}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-center font-bold text-blue-600">{entry.lotCount}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-gray-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.totalGaz.toLocaleString() : entry.totalMeters.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-green-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.readyGaz.toLocaleString() : entry.readyMeters.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-orange-600 font-semibold">
                        {stockUnit === 'gaz' ? entry.pendingGaz.toLocaleString() : entry.pendingMeters.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .report-container, .report-container * {
            visibility: visible;
          }
          .report-container {
            position: absolute;
            left: 0;
            top: 100px;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          th {
            background-color: #f3f4f6 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
          }
          td {
            border-bottom: 1px solid #e5e7eb !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
