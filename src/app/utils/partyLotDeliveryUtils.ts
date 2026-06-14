import { PartyLotDeliveryReport } from '../services/dashboardService';

export function formatMeters(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatReportDate(date: string): string {
  return new Date(date).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getPrintDateTime(): string {
  return new Date().toLocaleString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  if (status === 'Lot Complete') return '#15803d';
  if (status === 'Delivered') return '#2563eb';
  if (status === 'Pending') return '#dc2626';
  return '#374151';
}

export interface ExportFilters {
  party: string;
  fromDate: string;
  toDate: string;
  quality: string;
  lotNo: string;
  challanNo: string;
  status: string;
  groupBy: string;
  search: string;
}

export function exportPartyLotDeliveryExcel(
  report: PartyLotDeliveryReport,
  filters: ExportFilters,
  fileName: string
) {
  const filterRows = [
    { A: 'PARTY WISE LOT DELIVERY REPORT' },
    { A: 'Party', B: filters.party },
    { A: 'From Date', B: filters.fromDate },
    { A: 'To Date', B: filters.toDate },
    { A: 'Quality', B: filters.quality || 'All' },
    { A: 'Lot No', B: filters.lotNo || 'All' },
    { A: 'Challan No', B: filters.challanNo || 'All' },
    { A: 'Status', B: filters.status },
    { A: 'Group By', B: filters.groupBy },
    { A: 'Search', B: filters.search || '—' },
    {},
  ];

  const dataRows = report.lots.map((row) => ({
    'Sr No': row.srNo,
    'Lot No': row.lotNo,
    'Party Lot No': row.partyLotNo,
    'Delivery Date': row.deliveryDate,
    'Fabric Type': row.fabricType,
    'Party Name': row.partyName,
    Quality: row.quality,
    'Meters Sent': row.metersSent,
    'Meters Delivered': row.metersDelivered,
    'D.O No': row.doNo,
    'D.O Date': row.doDate,
    'Delivery Challan No': row.challanNo,
    'Challan Date': row.challanDate,
    Status: row.status,
  }));

  dataRows.push({
    'Sr No': '',
    'Lot No': 'TOTALS',
    'Party Lot No': '',
    'Delivery Date': '',
    'Fabric Type': '',
    'Party Name': '',
    Quality: '',
    'Meters Sent': report.summary.totalMetersSent,
    'Meters Delivered': report.summary.totalMetersDelivered,
    'D.O No': '',
    'D.O Date': '',
    'Delivery Challan No': `Efficiency: ${report.summary.deliveryEfficiency}%`,
    'Challan Date': '',
    Status: `Lots: ${report.summary.totalLots}`,
  } as any);

  return { filterRows, dataRows, fileName };
}
