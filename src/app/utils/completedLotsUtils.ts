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

export function exportCompletedLotsExcel(report: CompletedLotsReport, fileName: string, reportType?: 'completed' | 'incomplete' | 'all') {
  const isIncomplete = reportType === 'incomplete';
  
  const rows = report.lots.map((lot) => {
    const r: any = {
      Year: lot.year,
    };
    if (isIncomplete || lot.partyName) {
      r.Party = lot.partyName || '—';
    }
    r['Lot No'] = lot.lotNo;
    r['Bilty No'] = lot.biltyNo;
    r.Date = lot.date;
    r['Raw Quality'] = lot.quality;
    r.Than = lot.than;
    r['Meters In'] = lot.metersIn;
    r['Meters Out'] = lot.metersOut;
    r['Ready Meters'] = lot.totalMeters;
    r['D.O'] = lot.doQty;
    r['K-Wapsi'] = lot.kWapsi;
    r.Balance = lot.balance;
    if (!isIncomplete) {
      r.Percentage = lot.percentage;
    }
    r.Remarks = lot.remarks;
    return r;
  });

  const grandTotal: any = {
    Year: '',
  };
  if (isIncomplete || report.lots.some((l) => l.partyName)) {
    grandTotal.Party = '';
  }
  grandTotal['Lot No'] = 'GRAND TOTAL';
  grandTotal['Bilty No'] = '';
  grandTotal.Date = '';
  grandTotal['Raw Quality'] = '';
  grandTotal.Than = report.summary.totalBundles;
  grandTotal['Meters In'] = report.summary.totalMetersIn;
  grandTotal['Meters Out'] = report.summary.totalMetersOut;
  grandTotal['Ready Meters'] = report.summary.totalMeters;
  grandTotal['D.O'] = '';
  grandTotal['K-Wapsi'] = '';
  grandTotal.Balance = '';
  
  if (!isIncomplete) {
    grandTotal.Percentage = report.summary.productionDifference;
  }
  
  grandTotal.Remarks = `Total Lots: ${report.summary.totalLots}`;
  
  rows.push(grandTotal);

  return { rows, fileName };
}
