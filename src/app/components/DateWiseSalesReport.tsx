import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Printer, Layers } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { dashboardService, DateWiseSalesReport } from '../services/dashboardService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { qualityService, QualityItem } from '../services/qualityService';
import { PDFDateWiseSales } from './PDFDateWiseSales';
import {
  formatCurrency,
  formatNumber,
  formatReportDate,
  getPrintDateTime,
} from '../utils/dateWiseSalesUtils';
import { toast } from 'sonner';

interface DateWiseSalesReportViewProps {
  fromDate: string;
  toDate: string;
  customerId?: number | '';
  qualityId?: number | '';
  onCustomerIdChange?: (id: number | '') => void;
  onQualityIdChange?: (id: number | '') => void;
}

export default function DateWiseSalesReportView({
  fromDate,
  toDate,
  customerId: customerIdProp,
  qualityId: qualityIdProp,
  onCustomerIdChange,
  onQualityIdChange,
}: DateWiseSalesReportViewProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [qualities, setQualities] = useState<QualityItem[]>([]);
  const [internalCustomerId, setInternalCustomerId] = useState<number | ''>('');
  const [internalQualityId, setInternalQualityId] = useState<number | ''>('');
  const [viewMode, setViewMode] = useState<'list' | 'qualityWise'>('qualityWise');
  const [report, setReport] = useState<DateWiseSalesReport | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedCustomerId = customerIdProp !== undefined ? customerIdProp : internalCustomerId;
  const selectedQualityId = qualityIdProp !== undefined ? qualityIdProp : internalQualityId;
  const setSelectedCustomerId = customerIdProp !== undefined ? () => {} : setInternalCustomerId;
  const setSelectedQualityId = qualityIdProp !== undefined ? () => {} : setInternalQualityId;
  const filtersControlledExternally = customerIdProp !== undefined || qualityIdProp !== undefined;

  useEffect(() => {
    customerService.getCustomers('', 1, 1000).then((res) => setCustomers(res.data)).catch(console.error);
    qualityService.getQualities().then((res: any) => setQualities(res || [])).catch(console.error);
    organizationService.getOrganization().then(setOrganization).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!fromDate || !toDate) return;
      setLoading(true);
      try {
        const data = await dashboardService.getDateWiseSales({
          fromDate,
          toDate,
          customerId: selectedCustomerId || undefined,
          qualityId: selectedQualityId || undefined,
        });
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load date wise sales report');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [fromDate, toDate, selectedCustomerId, selectedQualityId]);

  const qualityGroups = useMemo(() => {
    if (!report?.data.length) return [];
    const map = new Map<string, typeof report.data>();
    report.data.forEach((row) => {
      const key = row.qualityName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([qualityName, rows]) => ({
        qualityName,
        rows,
        quantity: rows.reduce((s, r) => s + r.quantity, 0),
        amount: rows.reduce((s, r) => s + r.amount, 0),
      }));
  }, [report]);

  const selectedQualityName =
    report?.selectedQuality?.name ||
    qualities.find((q) => q.id === selectedQualityId)?.name ||
    'All Qualities';

  const selectedPartyName =
    customers.find((c) => c.id === selectedCustomerId)?.name || 'All Parties';

  const handlePrint = async () => {
    if (!report || !organization) return;
    try {
      const blob = await pdf(<PDFDateWiseSales report={report} org={organization} />).toBlob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'width=900,height=1100');
      if (!w) {
        toast.error('Please allow popups to print');
        return;
      }
      w.onload = () => setTimeout(() => w.print(), 800);
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleExcel = () => {
    if (!report) return;
    const headers = ['Date', 'Bill No', 'Challan No', 'Party Name', 'Quality Name', 'Quantity (Gazana)', 'Rate', 'Amount'];
    const rows = report.data.map((r) => [
      formatReportDate(r.date),
      r.billNo,
      r.challanNo,
      r.partyName,
      r.qualityName,
      r.quantity,
      r.rate,
      r.amount,
    ]);
    rows.push(['', '', '', '', 'TOTAL', report.totals.quantity, '', report.totals.amount]);

    const sheetRows: (string | number)[][] = [
      ['DATE WISE SALES REPORT'],
      ['From Date', fromDate],
      ['To Date', toDate],
      ['Party', customers.find((c) => c.id === selectedCustomerId)?.name || 'All'],
      ['Quality', qualities.find((q) => q.id === selectedQualityId)?.name || 'All'],
      [],
      headers,
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Date Wise Sales');
    XLSX.writeFile(wb, `Date-Wise-Sales_${fromDate}_${toDate}.xlsx`);
    toast.success('Excel exported');
  };

  const companyName = organization?.name || 'SHAN DYEING';

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100 flex flex-col gap-4 print:hidden bg-gradient-to-r from-slate-50 to-white">
        {!filtersControlledExternally && (
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[180px] relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-indigo-600 uppercase tracking-wider">Party</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 font-semibold text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">All Parties</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px] relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-purple-600 uppercase tracking-wider">Quality Wise</label>
              <select
                className="w-full px-3 py-2.5 rounded-lg border border-purple-200 font-semibold text-sm bg-purple-50/50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 outline-none"
                value={selectedQualityId}
                onChange={(e) => setSelectedQualityId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">All Qualities</option>
                {qualities.map((q) => (
                  <option key={q.id} value={q.id}>{q.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Filters:</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
              Party: {selectedPartyName}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-xs font-bold text-purple-800 border border-purple-200">
              Quality: {selectedQualityName}
            </span>
            {!selectedQualityId && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden ml-2">
                <button
                  type="button"
                  onClick={() => setViewMode('qualityWise')}
                  className={`px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${viewMode === 'qualityWise' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Layers size={14} /> Quality Wise
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-bold ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  List View
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
          <button onClick={handlePrint} disabled={!report || !organization} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleExcel} disabled={!report} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
            <Download size={16} /> Excel
          </button>
          {organization && report && (
            <PDFDownloadLink
              document={<PDFDateWiseSales report={report} org={organization} />}
              fileName={`Date-Wise-Sales_${fromDate}_${toDate}.pdf`}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-bold text-sm no-underline hover:bg-emerald-700"
            >
              {({ loading: pdfLoading }) => (
                <><Download size={16} />{pdfLoading ? 'Generating...' : 'PDF'}</>
              )}
            </PDFDownloadLink>
          )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 p-5 overflow-x-auto space-y-4">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        )}

        {!loading && report && report.data.length === 0 && (
          <div className="text-center py-16 text-gray-400 font-semibold">No sales records for the selected period.</div>
        )}

        {report && report.data.length > 0 && (
          <>
            {/* Quality Wise Summary */}
            {(report.qualitySummary?.length ?? 0) > 0 && !selectedQualityId && (
              <div className="max-w-6xl mx-auto border border-purple-200 rounded-lg overflow-hidden bg-white shadow-sm print:hidden">
                <div className="bg-purple-100 px-4 py-2 border-b border-purple-200">
                  <p className="text-xs font-black uppercase tracking-wider text-purple-900">Quality Wise Summary</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-purple-50 text-left">
                      <th className="px-4 py-2 text-xs font-black uppercase text-purple-800">Quality Name</th>
                      <th className="px-4 py-2 text-xs font-black uppercase text-purple-800 text-right">Bills</th>
                      <th className="px-4 py-2 text-xs font-black uppercase text-purple-800 text-right">Qty (Gazana)</th>
                      <th className="px-4 py-2 text-xs font-black uppercase text-purple-800 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.qualitySummary!.map((q, idx) => (
                      <tr
                        key={q.qualityName}
                        className={`cursor-pointer hover:bg-purple-50 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}
                        onClick={() => {
                          const match = qualities.find((item) => item.name === q.qualityName);
                          if (!match) return;
                          if (onQualityIdChange) onQualityIdChange(match.id);
                          else setSelectedQualityId(match.id);
                        }}
                      >
                        <td className="px-4 py-2 font-semibold text-purple-900">{q.qualityName}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{q.billCount}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatNumber(q.quantity, 2)}</td>
                        <td className="px-4 py-2 text-right tabular-nums font-bold">{formatCurrency(q.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          <div className="date-wise-sales-report max-w-6xl mx-auto border border-gray-300 bg-white shadow-sm">
            <div className="bg-slate-200 border-b border-gray-400 p-4 flex justify-between items-start">
              <div>
                <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">{companyName}</h1>
                {organization?.address && <p className="text-xs text-slate-600 mt-1">{organization.address}</p>}
                {organization?.phone && <p className="text-xs text-slate-600">Tel: {organization.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase text-slate-900">Date Wise Sales Report</p>
                <p className="text-xs text-purple-800 font-bold mt-1">Quality: {selectedQualityName}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {formatReportDate(fromDate)} — {formatReportDate(toDate)}
                </p>
                <p className="text-xs text-slate-500">Printed: {getPrintDateTime()}</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-slate-200 text-slate-800">
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-black uppercase">Date</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-black uppercase">Bill No</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-black uppercase">Challan No</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-black uppercase">Party Name</th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-xs font-black uppercase">Quality</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-xs font-black uppercase">Qty (Gazana)</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-xs font-black uppercase">Rate</th>
                    <th className="border border-gray-400 px-3 py-2 text-right text-xs font-black uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewMode === 'qualityWise' && !selectedQualityId
                    ? qualityGroups.flatMap((group) => [
                        <tr key={`hdr-${group.qualityName}`} className="bg-purple-100">
                          <td colSpan={8} className="border border-purple-300 px-3 py-2 font-black text-purple-900 text-xs uppercase tracking-wide">
                            Quality: {group.qualityName}
                          </td>
                        </tr>,
                        ...group.rows.map((row, idx) => (
                          <tr key={`${group.qualityName}-${row.billNo}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                            <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{formatReportDate(row.date)}</td>
                            <td className="border border-gray-300 px-3 py-2 font-mono font-semibold">{row.billNo}</td>
                            <td className="border border-gray-300 px-3 py-2 font-mono">{row.challanNo}</td>
                            <td className="border border-gray-300 px-3 py-2 font-medium">{row.partyName}</td>
                            <td className="border border-gray-300 px-3 py-2 text-indigo-800 font-medium">{row.qualityName}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{formatNumber(row.quantity, 2)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{formatNumber(row.rate, 2)}</td>
                            <td className="border border-gray-300 px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(row.amount)}</td>
                          </tr>
                        )),
                        <tr key={`sub-${group.qualityName}`} className="bg-purple-50 font-bold">
                          <td colSpan={5} className="border border-purple-200 px-3 py-2 text-right text-xs uppercase text-purple-800">
                            Subtotal — {group.qualityName}
                          </td>
                          <td className="border border-purple-200 px-3 py-2 text-right tabular-nums">{formatNumber(group.quantity, 2)}</td>
                          <td className="border border-purple-200 px-3 py-2"></td>
                          <td className="border border-purple-200 px-3 py-2 text-right tabular-nums">{formatCurrency(group.amount)}</td>
                        </tr>,
                      ])
                    : report.data.map((row, idx) => (
                        <tr key={`${row.billNo}-${row.challanNo}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="border border-gray-300 px-3 py-2 whitespace-nowrap">{formatReportDate(row.date)}</td>
                          <td className="border border-gray-300 px-3 py-2 font-mono font-semibold">{row.billNo}</td>
                          <td className="border border-gray-300 px-3 py-2 font-mono">{row.challanNo}</td>
                          <td className="border border-gray-300 px-3 py-2 font-medium">{row.partyName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-indigo-800 font-medium">{row.qualityName}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{formatNumber(row.quantity, 2)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right tabular-nums">{formatNumber(row.rate, 2)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(row.amount)}</td>
                        </tr>
                      ))
                  )}
                  <tr className="bg-slate-300 font-black">
                    <td colSpan={5} className="border border-gray-400 px-3 py-2.5 text-right uppercase text-xs tracking-wider">Grand Total</td>
                    <td className="border border-gray-400 px-3 py-2.5 text-right tabular-nums">{formatNumber(report.totals.quantity, 2)}</td>
                    <td className="border border-gray-400 px-3 py-2.5"></td>
                    <td className="border border-gray-400 px-3 py-2.5 text-right tabular-nums">{formatCurrency(report.totals.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
