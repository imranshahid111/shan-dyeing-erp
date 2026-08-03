import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Printer, Search, ChevronDown, User, X } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { dashboardService, SubLedgerReport } from '../services/dashboardService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { PDFSubLedger } from './PDFSubLedger';
import {
  formatAmount,
  formatBalance,
  formatBalanceShort,
  formatCurrency,
  formatReportDate,
  getPrintDateTime,
} from '../utils/subLedgerUtils';
import { toast } from 'sonner';

interface SubLedgerReportViewProps {
  fromDate: string;
  toDate: string;
}

export default function SubLedgerReportView({ fromDate, toDate }: SubLedgerReportViewProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<SubLedgerReport | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    customerService
      .getCustomers('', 1, 1000)
      .then((res) => {
        setCustomers(res.data);
        if (res.data.length > 0) setSelectedCustomerId(res.data[0].id);
      })
      .catch(console.error);
    organizationService.getOrganization().then(setOrganization).catch(console.error);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.customer_code && c.customer_code.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedCustomerId || !fromDate || !toDate) return;
      setLoading(true);
      try {
        const data = await dashboardService.getSubLedger({
          customerId: selectedCustomerId,
          fromDate,
          toDate,
        });
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load sub ledger report');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedCustomerId, fromDate, toDate]);

  const handlePdfPrint = async () => {
    if (!report || !organization) return;
    try {
      const blob = await pdf(<PDFSubLedger report={report} org={organization} />).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank', 'width=900,height=1100');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }
      printWindow.onload = () => setTimeout(() => printWindow.print(), 800);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    }
  };

  const companyName = organization?.name || 'SHAN DYEING';

  const totalGray = report?.transactions.reduce((sum, r) => sum + (Number(r.grayQty) || 0), 0) || 0;
  const totalReady = report?.transactions.reduce((sum, r) => sum + (Number(r.meterQty) || 0), 0) || 0;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between print:hidden">
        <div ref={dropdownRef} className="min-w-[320px] relative z-50">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider z-10">
            Customer / Party
          </label>
          <div
            className={`w-full px-4 py-2.5 rounded-xl border ${isDropdownOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} bg-gray-50 cursor-pointer flex justify-between items-center transition-all`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <User size={18} className="text-gray-400 flex-shrink-0" />
              <span className={selectedCustomer ? 'text-gray-800 font-bold text-sm truncate' : 'text-gray-400 font-medium text-sm'}>
                {selectedCustomer ? `${selectedCustomer.name} ${selectedCustomer.customer_code ? `(${selectedCustomer.customer_code})` : ''}` : 'Search customer...'}
              </span>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] max-h-72 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={15} />
                  <input
                    type="text"
                    className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400 font-medium"
                    placeholder="Search party name or code..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  {customerSearch && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCustomerSearch(''); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-1.5 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                    <Search size={20} className="text-gray-300" />
                    <p>No customers found matching "{customerSearch}"</p>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      className={`px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all ${selectedCustomerId === c.id ? 'bg-blue-50 border border-blue-100 font-bold' : 'hover:bg-gray-50 border border-transparent font-medium'}`}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setIsDropdownOpen(false);
                        setCustomerSearch('');
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className={selectedCustomerId === c.id ? 'text-blue-700' : 'text-gray-800'}>
                          {c.name}
                        </span>
                        {c.customer_code && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-mono font-bold">
                            {c.customer_code}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePdfPrint}
            disabled={!report || !organization}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-black text-base disabled:opacity-50"
          >
            <Printer size={20} />
            Print Report
          </button>
          {organization && report && (
            <PDFDownloadLink
              document={<PDFSubLedger report={report} org={organization} />}
              fileName={`Sub-Ledger-${report.customer.name.replace(/\s+/g, '-')}_${fromDate}_${toDate}.pdf`}
              className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-500/20 font-black text-base no-underline"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <Download size={20} />
                  {pdfLoading ? 'Generating...' : 'Export PDF'}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      <div className="relative flex-1 p-6 overflow-x-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {!loading && !report && (
          <div className="text-center py-20 text-gray-400 font-semibold">
            Select a customer and date range to generate the sub ledger report.
          </div>
        )}

        {report && (
          <div className="sub-ledger-report min-w-[1100px] max-w-6xl mx-auto border border-gray-300 bg-white text-sm text-black font-semibold">
            <div className="bg-gray-300 border-b border-black p-4 flex justify-between items-start">
              <div>
                <h1 className="text-base font-black uppercase tracking-wider">{companyName}</h1>
                {organization?.address && (
                  <p className="text-[10px] mt-1">{organization.address}</p>
                )}
                {organization?.phone && (
                  <p className="text-[10px]">Tel: {organization.phone}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-wide text-black">Sub Ledger Report</p>
                <p className="text-[10px] text-black mt-1">Print Date: {getPrintDateTime()}</p>
              </div>
            </div>

            <div className="border-b border-black p-3 flex justify-between bg-gray-50">
              <div>
                <p className="text-[10px] font-bold text-black uppercase">Customer / Party Name</p>
                <p className="font-black text-base text-black">{report.customer.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-black uppercase">Period</p>
                <p className="font-bold text-black text-sm">
                  {formatReportDate(report.fromDate)} — {formatReportDate(report.toDate)}
                </p>
              </div>
            </div>

            <table className="w-full border-collapse text-sm text-black">
              <thead>
                <tr className="bg-gray-300 text-black">
                  <th className="border border-black p-1.5 text-left font-black">Date</th>
                  <th className="border border-black p-1.5 text-left font-black">Reference Type</th>
                  <th className="border border-black p-1.5 text-left font-black">Invoice/Challan #</th>
                  <th className="border border-black p-1.5 text-left font-black">Lot Number</th>
                  <th className="border border-black p-1.5 text-left font-black">Description</th>
                  <th className="border border-black p-1.5 text-right font-black">Rate</th>
                  <th className="border border-black p-1.5 text-right font-black">Gray Mtr</th>
                  <th className="border border-black p-1.5 text-right font-black">Finish Mtr</th>
                  <th className="border border-black p-1.5 text-right font-black">Debit</th>
                  <th className="border border-black p-1.5 text-right font-black">Credit</th>
                  <th className="border border-black p-1.5 text-right font-black">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((row, idx) => (
                  <tr key={`${row.date}-${row.type}-${idx}`} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border border-black p-1.5 whitespace-nowrap font-semibold">
                      {formatReportDate(row.date)}
                    </td>
                    <td className="border border-black p-1.5 font-semibold">{row.referenceType}</td>
                    <td className="border border-black p-1.5 font-mono text-xs font-semibold">
                      {row.referenceNo !== '—' && <div>Inv: {row.referenceNo}</div>}
                      {row.doNo !== '—' && <div className="text-black">DO: {row.doNo}</div>}
                      {row.referenceNo === '—' && row.doNo === '—' && '—'}
                    </td>
                    <td className="border border-black p-1.5 font-mono font-bold">{row.lotNo}</td>

                    <td className="border border-black p-1.5 font-semibold">{row.description}</td>
                    <td className="border border-black p-1.5 text-right font-semibold">
                      {row.rate ? formatAmount(row.rate) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-bold">
                      {row.grayQty ? formatAmount(row.grayQty) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-bold">
                      {row.meterQty ? formatAmount(row.meterQty) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right text-black font-bold">
                      {row.debit ? formatAmount(row.debit) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right text-black font-bold">
                      {row.credit ? formatAmount(row.credit) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-black">
                      {formatBalanceShort(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end p-4 border-t border-black">
              <div className="w-72 border border-black text-sm text-black">
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Total Gray</span>
                  <span className="font-bold">{formatAmount(totalGray)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Total Finish</span>
                  <span className="font-bold">{formatAmount(totalReady)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Total Debit Amount</span>
                  <span className="font-bold">{formatCurrency(report.summary.totalDebit)}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-black bg-gray-100">
                  <span className="font-bold">Total Credit Amount</span>
                  <span className="font-bold">{formatCurrency(report.summary.totalCredit)}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-300 font-black">
                  <span>Closing Balance</span>
                  <span>{formatBalance(report.summary.closingBalance)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
