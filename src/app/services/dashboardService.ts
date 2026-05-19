import apiClient from './apiClient';

export interface DashboardSummary {
  totalCustomers: number;
  pendingOrders: number;
  totalReceivables: number;
  todayPayments: number;
}

export interface ChartData {
  monthlyData: { month: string; gray: number; ready: number }[];
  customerData: { name: string; value: number }[];
}

export interface ActivityItem {
  action: string;
  detail: string;
  time: string;
  color: string;
}

export interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface OutstandingEntry {
  customer: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

export interface StockEntry {
  lotNo: string;
  quality: string;
  measurement: string;
  grayStock: number;
  readyStock: number;
  pending: number;
  totalGazana: number;
  grayStockMeters: number;
  readyStockMeters: number;
  pendingMeters: number;
  totalMeters: number;
}

export interface QualityStockEntry {
  quality: string;
  lotCount: number;
  totalGaz: number;
  readyGaz: number;
  pendingGaz: number;
  totalMeters: number;
  readyMeters: number;
  pendingMeters: number;
}

export const dashboardService = {
  getSummary: () => {
    return apiClient.get<unknown, DashboardSummary>('/dashboard/summary');
  },
  getCharts: () => {
    return apiClient.get<unknown, ChartData>('/dashboard/charts');
  },
  getActivity: () => {
    return apiClient.get<unknown, ActivityItem[]>('/dashboard/activity');
  },
  getLedger: (params: { customerId: number; fromDate?: string; toDate?: string }) => {
    return apiClient.get<unknown, LedgerEntry[]>('/reports/ledger', { params });
  },
  getOutstanding: () => {
    return apiClient.get<unknown, OutstandingEntry[]>('/reports/outstanding');
  },
  getStock: () => {
    return apiClient.get<unknown, StockEntry[]>('/reports/stock');
  },
  getQualityStock: () => {
    return apiClient.get<unknown, QualityStockEntry[]>('/reports/stock/quality');
  },
};
