import { useEffect, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
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
  const [report, setReport] = useState<SubLedgerReport | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between print:hidden">
        <div className="min-w-[260px] relative">
          <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
            Customer / Party
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            value={selectedCustomerId || ''}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.customer_code ? `(${c.customer_code})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePdfPrint}
            disabled={!report || !organization}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm disabled:opacity-50"
          >
            <Printer size={16} />
            Print Report
          </button>
          {organization && report && (
            <PDFDownloadLink
              document={<PDFSubLedger report={report} org={organization} />}
              fileName={`Sub-Ledger-${report.customer.name.replace(/\s+/g, '-')}_${fromDate}_${toDate}.pdf`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm no-underline"
            >
              {({ loading: pdfLoading }) => (
                <>
                  <Download size={16} />
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
          <div className="sub-ledger-report min-w-[1100px] max-w-6xl mx-auto border border-gray-300 bg-white text-[11px] text-black">
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
                <p className="text-sm font-black uppercase tracking-wide">Sub Ledger Report</p>
                <p className="text-[10px] text-gray-600 mt-1">Print Date: {getPrintDateTime()}</p>
              </div>
            </div>

            <div className="border-b border-black p-3 flex justify-between bg-gray-50">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Customer / Party Name</p>
                <p className="font-black text-sm">{report.customer.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Period</p>
                <p className="font-bold">
                  {formatReportDate(report.fromDate)} — {formatReportDate(report.toDate)}
                </p>
              </div>
            </div>

            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border border-black p-1.5 text-left">Date</th>
                  <th className="border border-black p-1.5 text-left">Reference Type</th>
                  <th className="border border-black p-1.5 text-left">Invoice/Challan #</th>
                  <th className="border border-black p-1.5 text-left">Description</th>
                  <th className="border border-black p-1.5 text-right">Debit</th>
                  <th className="border border-black p-1.5 text-right">Credit</th>
                  <th className="border border-black p-1.5 text-right">Running Balance</th>
                  <th className="border border-black p-1.5 text-right">Rate</th>
                  <th className="border border-black p-1.5 text-left">Lot Number</th>
                  <th className="border border-black p-1.5 text-right">Bundle Qty</th>
                  <th className="border border-black p-1.5 text-right">Meter Qty</th>
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((row, idx) => (
                  <tr key={`${row.date}-${row.type}-${idx}`} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border border-black p-1.5 whitespace-nowrap">
                      {formatReportDate(row.date)}
                    </td>
                    <td className="border border-black p-1.5">{row.referenceType}</td>
                    <td className="border border-black p-1.5 font-mono">{row.referenceNo}</td>
                    <td className="border border-black p-1.5">{row.description}</td>
                    <td className="border border-black p-1.5 text-right text-red-700 font-semibold">
                      {row.debit ? formatAmount(row.debit) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right text-emerald-700 font-semibold">
                      {row.credit ? formatAmount(row.credit) : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right font-bold">
                      {formatBalanceShort(row.balance)}
                    </td>
                    <td className="border border-black p-1.5 text-right">
                      {row.rate ? formatAmount(row.rate) : '—'}
                    </td>
                    <td className="border border-black p-1.5 font-mono">{row.lotNo}</td>
                    <td className="border border-black p-1.5 text-right">
                      {row.bundleQty ? row.bundleQty : '—'}
                    </td>
                    <td className="border border-black p-1.5 text-right">
                      {row.meterQty ? formatAmount(row.meterQty) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end p-4 border-t border-black">
              <div className="w-72 border border-black text-[11px]">
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
