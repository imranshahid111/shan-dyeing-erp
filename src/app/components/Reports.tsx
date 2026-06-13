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
    <div className="space-y-6 pb-20 print:pb-0 max-w-[1600px] mx-auto fade-in">
      
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Filter size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">System Reports</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Export customized reports and analyze business metrics</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-bold text-sm"
          >
            <Printer size={16} />
            Print PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/20 font-bold text-sm"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex flex-wrap gap-1 print:hidden">
        {[
          { id: 'ledger', label: 'Customer Ledger', icon: List },
          { id: 'outstanding', label: 'Outstanding', icon: DollarSign },
          { id: 'stock', label: 'Stock Report', icon: Package },
          { id: 'invoices', label: 'Invoices', icon: FileText },
          { id: 'payments', label: 'Payments', icon: CheckSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-100' : 'text-gray-400'} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== 'outstanding' && activeTab !== 'stock' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 print:hidden flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex-1 w-full flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative group">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider transition-colors">From Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-700 text-sm transition-all bg-gray-50 focus:bg-white"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px] relative group">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider transition-colors">To Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-700 text-sm transition-all bg-gray-50 focus:bg-white"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {activeTab === 'ledger' && (
              <div className="flex-1 min-w-[250px] relative group">
                <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider transition-colors">Select Customer</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-gray-700 text-sm transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            )}
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 print:border-none print:shadow-none report-container relative min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
             <div className="bg-white p-4 rounded-full shadow-lg">
               <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
          </div>
        )}

        {/* 1. Customer Ledger */}
        {activeTab === 'ledger' && (
          <>
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl">
                  {selectedCustomerName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{selectedCustomerName}</h3>
                  <p className="text-sm text-gray-500 font-semibold mt-0.5">Account Ledger Statement</p>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 text-right w-full md:w-auto">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                <p className={`text-2xl font-black tracking-tight ${currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  <span className="text-sm mr-1 font-bold text-gray-400">Rs</span>
                  {Math.abs(currentBalance).toLocaleString()} 
                  <span className="text-sm ml-1">{currentBalance > 0 ? '(Dr)' : '(Cr)'}</span>
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Description</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Debit</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Credit</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                  {ledgerData.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-semibold">No records found for this period.</td></tr>
                  )}
                  {ledgerData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{entry.date}</td>
                      <td className="px-6 py-4 text-gray-800 font-bold max-w-[300px] truncate group-hover:text-blue-700 transition-colors">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600/90">
                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-emerald-600/90">
                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-gray-900">
                        {entry.balance.toLocaleString()}
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-xl font-black text-gray-900">Outstanding Summary</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">Consolidated customer balances</p>
              </div>
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 font-bold text-sm">
                Total Dues: Rs {outstandingData.reduce((sum, e) => sum + e.outstanding, 0).toLocaleString()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Total Billed</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Total Paid</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                  {outstandingData.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-semibold">No pending dues found.</td></tr>
                  )}
                  {outstandingData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs">
                          {entry.customer.charAt(0)}
                        </div>
                        {entry.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 font-semibold">
                        {entry.totalBilled.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600/90 font-semibold">
                        {entry.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-red-600">
                        {entry.outstanding.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 print:bg-gray-200">
                  <tr>
                    <td className="px-6 py-5 font-black text-gray-900 uppercase tracking-widest">Grand Total</td>
                    <td className="px-6 py-5 text-right font-black text-gray-700">
                      Rs {outstandingData.reduce((sum, e) => sum + e.totalBilled, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600">
                      Rs {outstandingData.reduce((sum, e) => sum + e.totalPaid, 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-red-600 text-lg">
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-xl font-black text-gray-900">Invoices Log</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">Detailed billing records</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 font-bold text-sm">
                Total Billed: Rs {invoicesData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Invoice #</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Lot #</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Ready Stock</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Rate</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                  {invoicesData.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-semibold">No invoices found for this period.</td></tr>
                  )}
                  {invoicesData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{entry.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-black text-gray-900">{entry.invoiceNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700">{entry.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-mono text-xs font-bold border border-gray-200">
                          {entry.lotNo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-blue-600">
                        {entry.readyStock} <span className="text-xs text-blue-400 uppercase">{entry.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 font-semibold">
                        {entry.rate} <span className="text-[10px] uppercase text-gray-400">/ {entry.rateUnit === 'yard' ? 'Gaz' : 'Mtr'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-emerald-600">
                        {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 print:bg-gray-200">
                  <tr>
                    <td colSpan={6} className="px-6 py-5 font-black text-gray-900 uppercase tracking-widest text-right">Total Amount</td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600 text-lg">
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
              <div>
                <h3 className="text-xl font-black text-gray-900">Payments Log</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">Receipts and collected amounts</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 font-bold text-sm">
                Total Collected: Rs {paymentsData.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Date</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Customer</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Invoice Ref</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Method</th>
                    <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Reference</th>
                    <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                  {paymentsData.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-semibold">No payments found for this period.</td></tr>
                  )}
                  {paymentsData.map((entry, index) => (
                    <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{entry.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{entry.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-500">{entry.invoiceNo || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          entry.method.toLowerCase().includes('cash') ? 'bg-emerald-100 text-emerald-700' : 
                          entry.method.toLowerCase().includes('cheque') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entry.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-500">{entry.reference || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-emerald-600">
                        {entry.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200 print:bg-gray-200">
                  <tr>
                    <td colSpan={5} className="px-6 py-5 font-black text-gray-900 uppercase tracking-widest text-right">Total Collected</td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600 text-lg">
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
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div>
                <h3 className="text-xl font-black text-gray-900">Inventory Status</h3>
                <p className="text-sm text-gray-500 font-semibold mt-0.5">Real-time stock levels</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-gray-100/80 p-1 rounded-xl flex">
                  <button
                    onClick={() => setStockView('lots')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      stockView === 'lots' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    By Lot
                  </button>
                  <button
                    onClick={() => setStockView('quality')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      stockView === 'quality' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    By Quality
                  </button>
                </div>
                <div className="bg-gray-100/80 p-1 rounded-xl flex">
                  <button
                    onClick={() => setStockUnit('gaz')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      stockUnit === 'gaz' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Yards
                  </button>
                  <button
                    onClick={() => setStockUnit('meters')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      stockUnit === 'meters' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Meters
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              {stockView === 'lots' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Lot No</th>
                      <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Quality</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Received</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Gray Stock</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Ready Stock</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                    {stockData.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-semibold">No stock data available.</td></tr>
                    )}
                    {stockData.map((entry, index) => (
                      <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-mono text-xs font-bold border border-gray-200">
                            {entry.lotNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-black text-purple-700">{entry.quality}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 font-semibold">
                          {stockUnit === 'gaz' ? entry.totalGazana.toLocaleString() : entry.totalMeters.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-800 font-bold">
                          {stockUnit === 'gaz' ? entry.grayStock.toLocaleString() : entry.grayStockMeters.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-bold">
                          {stockUnit === 'gaz' ? entry.readyStock.toLocaleString() : entry.readyStockMeters.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-amber-600 font-bold">
                          {stockUnit === 'gaz' ? entry.pending.toLocaleString() : entry.pendingMeters.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {stockView === 'quality' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 border-b border-gray-100 print:bg-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left font-black text-gray-500 uppercase tracking-wider text-[10px]">Quality</th>
                      <th className="px-6 py-4 text-center font-black text-gray-500 uppercase tracking-wider text-[10px]">Lots</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Total Received</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Ready Stock</th>
                      <th className="px-6 py-4 text-right font-black text-gray-500 uppercase tracking-wider text-[10px]">Total Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 print:divide-gray-300">
                    {qualityStockData.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-semibold">No stock data available.</td></tr>
                    )}
                    {qualityStockData.map((entry, index) => (
                      <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-black text-purple-700 text-base">{entry.quality}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold text-xs">
                            {entry.lotCount} Lots
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 font-bold">
                          {stockUnit === 'gaz' ? entry.totalGaz.toLocaleString() : entry.totalMeters.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-black">
                          {stockUnit === 'gaz' ? entry.readyGaz.toLocaleString() : entry.readyMeters.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-amber-600 font-black">
                          {stockUnit === 'gaz' ? entry.pendingGaz.toLocaleString() : entry.pendingMeters.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        @media print {
          @page { size: A4 landscape; margin: 15mm; }
          body { background: white !important; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .report-container, .report-container * { visibility: visible; }
          .report-container {
            position: absolute; left: 0; top: 120px; width: 100%;
            background: white !important; color: black !important;
            border: none !important; box-shadow: none !important;
          }
          .print\\:hidden { display: none !important; }
          th { background-color: #f3f4f6 !important; color: #374151 !important; border-bottom: 2px solid #e5e7eb !important; -webkit-print-color-adjust: exact; }
          td { border-bottom: 1px solid #e5e7eb !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
