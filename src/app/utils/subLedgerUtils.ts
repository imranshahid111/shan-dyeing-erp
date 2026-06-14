import { SubLedgerReport } from '../services/dashboardService';

export function formatCurrency(value: number): string {
  return `Rs. ${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAmount(value: number): string {
  if (!value) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatBalance(value: number): string {
  if (value === 0) return 'Rs. 0';
  const suffix = value > 0 ? 'Dr' : 'Cr';
  return `${formatCurrency(value)} ${suffix}`;
}

export function formatBalanceShort(value: number): string {
  if (value === 0) return '0';
  const suffix = value > 0 ? 'Dr' : 'Cr';
  return `${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${suffix}`;
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

export type SubLedgerReportData = SubLedgerReport;
