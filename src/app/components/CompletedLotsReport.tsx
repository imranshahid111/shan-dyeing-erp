import { useEffect, useState } from 'react';
import { Download, Loader2, Printer, Search } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { dashboardService, CompletedLotsReport } from '../services/dashboardService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { qualityService, QualityItem } from '../services/qualityService';
import { PDFCompletedLots } from './PDFCompletedLots';
import {
  exportCompletedLotsExcel,
  formatMeters,
  formatReportDate,
  getPercentageColor,
  getPrintDateTime,
} from '../utils/completedLotsUtils';
import { toast } from 'sonner';

interface CompletedLotsReportViewProps {
  fromDate: string;
  toDate: string;
}

type SortField = 'date' | 'lotNo' | 'totalMeters' | 'quality';

export default function CompletedLotsReportView({ fromDate, toDate }: CompletedLotsReportViewProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [qualities, setQualities] = useState<QualityItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedQualityId, setSelectedQualityId] = useState<number | ''>('');
  const [lotNoFilter, setLotNoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [report, setReport] = useState<CompletedLotsReport | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    customerService.getCustomers('', 1, 1000).then((res) => setCustomers(res.data)).catch(console.error);
    qualityService.getQualities().then((res: any) => setQualities(res || [])).catch(console.error);
    organizationService.getOrganization().then(setOrganization).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getCompletedLots({
          fromDate,
          toDate,
          customerId: selectedCustomerId || undefined,
          qualityId: selectedQualityId || undefined,
          lotNo: lotNoFilter || undefined,
          search: search || undefined,
          sortBy,
          sortOrder,
        });
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load completed lots report');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [fromDate, toDate, selectedCustomerId, selectedQualityId, lotNoFilter, search, sortBy, sortOrder]);

  const handlePdfPrint = async () => {
    if (!report || !organization) return;
    try {
      const blob = await pdf(<PDFCompletedLots report={report} org={organization} />).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank', 'width=1200,height=800');
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

  const handleExcelExport = () => {
    if (!report) return;
    const partySlug = report.party.name.replace(/\s+/g, '-');
    const { rows, fileName } = exportCompletedLotsExcel(
      report,
      `Completed-Lots_${partySlug}_${fromDate}_${toDate}.xlsx`
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Completed Lots');
    XLSX.writeFile(wb, fileName);
    toast.success('Excel exported successfully');
  };

  const companyName = organization?.name || 'SHAN DYEING';

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 space-y-4 print:hidden">
        <div className="flex flex-wrap gap-4">
          <div className="min-w-[200px] relative flex-1">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Party / Customer
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Parties</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] relative flex-1">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Fabric Quality
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedQualityId}
              onChange={(e) => setSelectedQualityId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Qualities</option>
              {qualities.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px] relative flex-1">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Lot Number
            </label>
            <input
              type="text"
              placeholder="Filter lot..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={lotNoFilter}
              onChange={(e) => setLotNoFilter(e.target.value)}
            />
          </div>
          <div className="min-w-[180px] relative flex-[1.5]">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Search
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Lot, bilty, quality..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 bg-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
            >
              <option value="date">Sort: Date</option>
              <option value="lotNo">Sort: Lot Number</option>
              <option value="totalMeters">Sort: Total Meters</option>
              <option value="quality">Sort: Quality</option>
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 bg-white"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePdfPrint}
              disabled={!report || !organization}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm disabled:opacity-50"
            >
              <Printer size={16} />
              Print Report
            </button>
            <button
              onClick={handleExcelExport}
              disabled={!report}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm disabled:opacity-50"
            >
              <Download size={16} />
              Export Excel
            </button>
            {organization && report && (
              <PDFDownloadLink
                document={<PDFCompletedLots report={report} org={organization} />}
                fileName={`Completed-Lots_${report.party.name.replace(/\s+/g, '-')}_${fromDate}_${toDate}.pdf`}
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
      </div>

      <div className="relative flex-1 p-6 overflow-x-auto">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {!loading && report && report.lots.length === 0 && (
          <div className="text-center py-20 text-gray-400 font-semibold">
            No completed lots found for the selected filters.
          </div>
        )}

        {report && report.lots.length > 0 && (
          <div className="completed-lots-report min-w-[1400px]">
            <div className="bg-gray-300 border border-black p-4 flex justify-between items-start mb-0">
              <div>
                <h1 className="text-base font-black uppercase tracking-wider">{companyName}</h1>
                {organization?.address && <p className="text-[10px] mt-1">{organization.address}</p>}
                {organization?.phone && <p className="text-[10px]">Tel: {organization.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-wide">Completed Lots Report</p>
                <p className="text-[10px] text-gray-600 mt-1">Party: {report.party.name}</p>
                <p className="text-[10px]">Print: {getPrintDateTime()}</p>
              </div>
            </div>

            <div className="border border-t-0 border-black overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-gray-300">
                    {['Year', 'Lot No', 'Bilty No', 'Date', 'Raw Quality', 'Than', 'Meters In', 'Meters Out', 'Total Meters', 'D.O', 'K-Wapsi', 'Balance', 'Percentage', 'Remarks'].map((h) => (
                      <th key={h} className="border border-black p-1.5 text-left whitespace-nowrap font-black uppercase text-[9px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.lots.map((lot, idx) => (
                    <tr key={`${lot.lotNo}-${idx}`} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-black p-1.5 text-center">{lot.year}</td>
                      <td className="border border-black p-1.5 font-mono font-bold">{lot.lotNo}</td>
                      <td className="border border-black p-1.5 font-mono">{lot.biltyNo}</td>
                      <td className="border border-black p-1.5 whitespace-nowrap">{formatReportDate(lot.date)}</td>
                      <td className="border border-black p-1.5 font-semibold text-purple-800">{lot.quality}</td>
                      <td className="border border-black p-1.5 text-right">{lot.than}</td>
                      <td className="border border-black p-1.5 text-right">{formatMeters(lot.metersIn)}</td>
                      <td className="border border-black p-1.5 text-right">{formatMeters(lot.metersOut)}</td>
                      <td className="border border-black p-1.5 text-right font-bold">{formatMeters(lot.totalMeters)}</td>
                      <td className="border border-black p-1.5 text-right">{formatMeters(lot.doQty)}</td>
                      <td className="border border-black p-1.5 text-right">{formatMeters(lot.kWapsi)}</td>
                      <td className="border border-black p-1.5 text-right">{formatMeters(lot.balance)}</td>
                      <td
                        className="border border-black p-1.5 text-right font-bold"
                        style={{ color: getPercentageColor(lot.percentage) }}
                      >
                        {lot.percentage > 0 ? '+' : ''}{lot.percentage}%
                      </td>
                      <td className="border border-black p-1.5 text-gray-600">{lot.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-t-0 border-black bg-gray-200 p-3 flex flex-wrap gap-6 text-[11px] font-bold">
              <span>Total Lots: {report.summary.totalLots}</span>
              <span>Total Bundles: {formatMeters(report.summary.totalBundles)}</span>
              <span>Total Meters In: {formatMeters(report.summary.totalMetersIn)}</span>
              <span>Total Meters Out: {formatMeters(report.summary.totalMetersOut)}</span>
              <span style={{ color: getPercentageColor(-report.summary.productionDifference) }}>
                Production Difference: {formatMeters(report.summary.productionDifference)}
              </span>
            </div>

            <div className="border border-t-0 border-black bg-gray-300 p-4 text-[11px] font-black">
              <p className="mb-2 uppercase tracking-wider">Grand Totals</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <span>Bundles: {formatMeters(report.summary.totalBundles)}</span>
                <span>Meters In: {formatMeters(report.summary.totalMetersIn)}</span>
                <span>Meters Out: {formatMeters(report.summary.totalMetersOut)}</span>
                <span style={{ color: getPercentageColor(-report.summary.productionDifference) }}>
                  Difference: {formatMeters(report.summary.productionDifference)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
