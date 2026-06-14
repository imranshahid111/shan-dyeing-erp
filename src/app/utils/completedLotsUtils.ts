import { CompletedLotsReport } from '../services/dashboardService';

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

export function getPercentageColor(percentage: number): string {
  if (percentage > 0) return '#15803d';
  if (percentage < 0) return '#dc2626';
  return '#374151';
}

export function exportCompletedLotsExcel(report: CompletedLotsReport, fileName: string) {
  const rows = report.lots.map((lot) => ({
    Year: lot.year,
    'Lot No': lot.lotNo,
    'Bilty No': lot.biltyNo,
    Date: lot.date,
    'Raw Quality': lot.quality,
    Than: lot.than,
    'Meters In': lot.metersIn,
    'Meters Out': lot.metersOut,
    'Total Meters': lot.totalMeters,
    'D.O': lot.doQty,
    'K-Wapsi': lot.kWapsi,
    Balance: lot.balance,
    Percentage: lot.percentage,
    Remarks: lot.remarks,
  }));

  rows.push({
    Year: '',
    'Lot No': 'GRAND TOTAL',
    'Bilty No': '',
    Date: '',
    'Raw Quality': '',
    Than: report.summary.totalBundles,
    'Meters In': report.summary.totalMetersIn,
    'Meters Out': report.summary.totalMetersOut,
    'Total Meters': report.summary.totalMeters,
    'D.O': '',
    'K-Wapsi': '',
    Balance: '',
    Percentage: report.summary.productionDifference,
    Remarks: `Total Lots: ${report.summary.totalLots}`,
  } as any);

  return { rows, fileName };
}
