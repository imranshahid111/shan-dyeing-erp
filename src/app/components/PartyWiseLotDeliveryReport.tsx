import { useEffect, useMemo, useState, Fragment } from 'react';
import { Download, Loader2, Printer, Search } from 'lucide-react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { dashboardService, PartyLotDeliveryReport } from '../services/dashboardService';
import { organizationService, Organization } from '../services/organizationService';
import { customerService, CustomerItem } from '../services/customerService';
import { qualityService, QualityItem } from '../services/qualityService';
import { PDFPartyWiseLotDelivery } from './PDFPartyWiseLotDelivery';
import {
  exportPartyLotDeliveryExcel,
  formatMeters,
  formatReportDate,
  getPrintDateTime,
  getStatusColor,
} from '../utils/partyLotDeliveryUtils';
import { toast } from 'sonner';

interface PartyWiseLotDeliveryReportProps {
  fromDate: string;
  toDate: string;
}

type StatusFilter = 'all' | 'Delivered' | 'Pending' | 'Lot Complete';
type GroupBy = 'party' | 'quality' | 'fabricType' | 'deliveryDate';

export default function PartyWiseLotDeliveryReport({ fromDate, toDate }: PartyWiseLotDeliveryReportProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [qualities, setQualities] = useState<QualityItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedQualityId, setSelectedQualityId] = useState<number | ''>('');
  const [lotNoFilter, setLotNoFilter] = useState('');
  const [challanNoFilter, setChallanNoFilter] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('party');
  const [report, setReport] = useState<PartyLotDeliveryReport | null>(null);
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
        const data = await dashboardService.getPartyLotDelivery({
          fromDate,
          toDate,
          customerId: selectedCustomerId || undefined,
          qualityId: selectedQualityId || undefined,
          lotNo: lotNoFilter || undefined,
          challanNo: challanNoFilter || undefined,
          search: search || undefined,
          status: statusFilter === 'all' ? 'all' : statusFilter,
          groupBy,
        });
        setReport(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load party wise lot delivery report');
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [
    fromDate,
    toDate,
    selectedCustomerId,
    selectedQualityId,
    lotNoFilter,
    challanNoFilter,
    search,
    statusFilter,
    groupBy,
  ]);

  const groupedRows = useMemo(() => {
    if (!report) return [];

    if (groupBy === 'party') {
      return report.lots.map((row) => ({ row, groupLabel: null as string | null }));
    }

    const map = new Map<string, typeof report.lots>();
    report.lots.forEach((row) => {
      let key = row.partyName;
      if (groupBy === 'quality') key = row.quality;
      if (groupBy === 'fabricType') key = row.fabricType;
      if (groupBy === 'deliveryDate') key = formatReportDate(row.deliveryDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    });

    const result: { row: (typeof report.lots)[0]; groupLabel: string | null }[] = [];
    map.forEach((rows, key) => {
      rows.forEach((row, idx) => {
        result.push({ row, groupLabel: idx === 0 ? key : null });
      });
    });
    return result;
  }, [report, groupBy]);

  const handlePdfPrint = async () => {
    if (!report || !organization) return;
    try {
      const blob = await pdf(<PDFPartyWiseLotDelivery report={report} org={organization} />).toBlob();
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
    const partyName =
      customers.find((c) => c.id === selectedCustomerId)?.name || report.party.name;
    const qualityName = qualities.find((q) => q.id === selectedQualityId)?.name || 'All';
    const { dataRows, fileName } = exportPartyLotDeliveryExcel(
      report,
      {
        party: partyName,
        fromDate,
        toDate,
        quality: qualityName,
        lotNo: lotNoFilter,
        challanNo: challanNoFilter,
        status: statusFilter,
        groupBy,
        search,
      },
      `Party-Lot-Delivery_${fromDate}_${toDate}.xlsx`
    );

    const headers = Object.keys(dataRows[0] || {});
    const sheetRows: (string | number)[][] = [
      ['PARTY WISE LOT DELIVERY REPORT'],
      ['Party', partyName],
      ['From Date', fromDate],
      ['To Date', toDate],
      ['Quality', qualityName],
      ['Lot No', lotNoFilter || 'All'],
      ['Challan No', challanNoFilter || 'All'],
      ['Status', statusFilter],
      ['Group By', groupBy],
      ['Search', search || '—'],
      [],
      headers,
      ...dataRows.map((row) => headers.map((h) => (row as any)[h] ?? '')),
    ];

    const ws = XLSX.utils.aoa_to_sheet(sheetRows);
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lot Delivery');
    XLSX.writeFile(wb, fileName);
    toast.success('Excel exported successfully');
  };

  const companyName = organization?.name || 'SHAN DYEING';

  const groupPrefix =
    groupBy === 'quality' ? 'Quality: ' :
    groupBy === 'fabricType' ? 'Fabric Type: ' :
    groupBy === 'deliveryDate' ? 'Date: ' : '';

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 space-y-4 print:hidden">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Party / Customer
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Parties</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px] flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Quality
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedQualityId}
              onChange={(e) => setSelectedQualityId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Qualities</option>
              {qualities.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[120px] flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Lot No
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={lotNoFilter}
              onChange={(e) => setLotNoFilter(e.target.value)}
              placeholder="Lot..."
            />
          </div>
          <div className="min-w-[120px] flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Challan No
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={challanNoFilter}
              onChange={(e) => setChallanNoFilter(e.target.value)}
              placeholder="DC..."
            />
          </div>
          <div className="min-w-[130px] flex-1 relative">
            <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
              Status
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="Delivered">Delivered</option>
              <option value="Pending">Pending</option>
              <option value="Lot Complete">Lot Complete</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="min-w-[200px] flex-1 relative">
              <label className="absolute -top-2 left-3 bg-white px-1 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Lot, party lot, challan, D.O, quality..."
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 font-semibold text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-3 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 bg-white"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="party">Group: Party</option>
              <option value="quality">Group: Quality</option>
              <option value="fabricType">Group: Fabric Type</option>
              <option value="deliveryDate">Group: Delivery Date</option>
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
                document={<PDFPartyWiseLotDelivery report={report} org={organization} />}
                fileName={`Party-Lot-Delivery_${report.party.name.replace(/\s+/g, '-')}_${fromDate}_${toDate}.pdf`}
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
            No lot delivery records found for the selected filters.
          </div>
        )}

        {report && report.lots.length > 0 && (
          <div className="party-lot-delivery-report min-w-[1500px]">
            <div className="bg-gray-300 border border-black p-4 flex justify-between items-start">
              <div>
                <h1 className="text-base font-black uppercase tracking-wider">{companyName}</h1>
                {organization?.address && <p className="text-[10px] mt-1">{organization.address}</p>}
                {organization?.phone && <p className="text-[10px]">Tel: {organization.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-black uppercase tracking-wide">Party Wise Lot Delivery Report</p>
                <p className="text-[10px] mt-1">Party: {report.party.name}</p>
                <p className="text-[10px]">
                  {formatReportDate(fromDate)} — {formatReportDate(toDate)}
                </p>
                <p className="text-[10px]">Print: {getPrintDateTime()}</p>
              </div>
            </div>

            <div className="border border-t-0 border-black overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead className="sticky top-0 z-[1]">
                  <tr className="bg-gray-300">
                    {[
                      'Sr No', 'Lot No', 'Party Lot No', 'Delivery Date', 'Fabric Type', 'Party Name',
                      'Quality', 'Meters Sent', 'Meters Delivered', 'D.O No', 'D.O Date',
                      'Delivery Challan No', 'Challan Date', 'Status',
                    ].map((h) => (
                      <th key={h} className="border border-black p-1.5 text-left whitespace-nowrap font-black uppercase text-[8px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupedRows.map(({ row, groupLabel }, idx) => (
                    <Fragment key={`${row.srNo}-${row.doNo}-${idx}`}>
                      {groupLabel && groupBy !== 'party' && (
                        <tr className="bg-blue-100">
                          <td colSpan={14} className="border border-black p-2 font-black text-blue-800 uppercase text-[9px]">
                            {groupPrefix}{groupLabel}
                          </td>
                        </tr>
                      )}
                      <tr className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="border border-black p-1.5 text-center font-bold">{row.srNo}</td>
                        <td className="border border-black p-1.5 font-mono font-bold">{row.lotNo}</td>
                        <td className="border border-black p-1.5 font-mono">{row.partyLotNo}</td>
                        <td className="border border-black p-1.5 whitespace-nowrap">{formatReportDate(row.deliveryDate)}</td>
                        <td className="border border-black p-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-gray-100 font-semibold">{row.fabricType}</span>
                        </td>
                        <td className="border border-black p-1.5 font-semibold">{row.partyName}</td>
                        <td className="border border-black p-1.5 text-purple-800 font-semibold">{row.quality}</td>
                        <td className="border border-black p-1.5 text-right">{formatMeters(row.metersSent)}</td>
                        <td className="border border-black p-1.5 text-right font-bold">{formatMeters(row.metersDelivered)}</td>
                        <td className="border border-black p-1.5 font-mono">{row.doNo}</td>
                        <td className="border border-black p-1.5 whitespace-nowrap">{formatReportDate(row.doDate)}</td>
                        <td className="border border-black p-1.5 font-mono">{row.challanNo}</td>
                        <td className="border border-black p-1.5 whitespace-nowrap">{formatReportDate(row.challanDate)}</td>
                        <td className="border border-black p-1.5 font-bold" style={{ color: getStatusColor(row.status) }}>
                          {row.status}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border border-t-0 border-black bg-gray-200 p-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px] font-bold">
              <span>Total Lots: {report.summary.totalLots}</span>
              <span>Sent: {formatMeters(report.summary.totalMetersSent)} M</span>
              <span>Delivered: {formatMeters(report.summary.totalMetersDelivered)} M</span>
              <span>Difference: {formatMeters(report.summary.totalDifference)} M</span>
              <span className="text-emerald-700">Efficiency: {report.summary.deliveryEfficiency}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
