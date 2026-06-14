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

export interface PaymentReportEntry {
  date: string;
  customer: string;
  invoiceNo: string;
  method: string;
  reference: string;
  amount: number;
}

export interface InvoiceReportEntry {
  date: string;
  invoiceNo: string;
  customer: string;
  lotNo: string;
  readyStock: number;
  unit: string;
  rate: number;
  rateUnit: string;
  amount: number;
}

export interface SubLedgerTransaction {
  date: string;
  type: string;
  referenceType: string;
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  rate: number;
  lotNo: string;
  bundleQty: number;
  meterQty: number;
}

export interface SubLedgerReport {
  customer: {
    id: number;
    name: string;
    code?: string;
    phone?: string;
    address?: string;
  };
  fromDate: string;
  toDate: string;
  openingBalance: number;
  transactions: SubLedgerTransaction[];
  summary: {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
  };
}

export interface CompletedLotEntry {
  year: number;
  lotNo: string;
  biltyNo: string;
  date: string;
  quality: string;
  than: number;
  metersIn: number;
  metersOut: number;
  totalMeters: number;
  doQty: number;
  kWapsi: number;
  balance: number;
  percentage: number;
  remarks: string;
  partyName?: string;
}

export interface CompletedLotsReport {
  party: { id: number | null; name: string };
  fromDate: string | null;
  toDate: string | null;
  lots: CompletedLotEntry[];
  summary: {
    totalLots: number;
    totalBundles: number;
    totalMetersIn: number;
    totalMetersOut: number;
    totalMeters: number;
    productionDifference: number;
  };
}

export interface PartyLotDeliveryEntry {
  srNo: number;
  lotNo: string;
  partyLotNo: string;
  deliveryDate: string;
  fabricType: string;
  partyName: string;
  quality: string;
  metersSent: number;
  metersDelivered: number;
  difference: number;
  doNo: string;
  doDate: string;
  challanNo: string;
  challanDate: string;
  status: string;
}

export interface PartyLotDeliveryReport {
  party: { id: number | null; name: string };
  fromDate: string | null;
  toDate: string | null;
  groupBy: string;
  lots: PartyLotDeliveryEntry[];
  summary: {
    totalLots: number;
    uniqueLots: number;
    totalMetersSent: number;
    totalMetersDelivered: number;
    totalDifference: number;
    deliveryEfficiency: number;
  };
}

export interface DateWiseSalesEntry {
  date: string;
  billNo: string;
  challanNo: string;
  partyName: string;
  qualityName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface DateWiseSalesReport {
  fromDate: string | null;
  toDate: string | null;
  selectedQuality?: { id: number; name: string } | null;
  data: DateWiseSalesEntry[];
  totals: {
    quantity: number;
    amount: number;
  };
  qualitySummary: {
    qualityName: string;
    quantity: number;
    amount: number;
    billCount: number;
  }[];
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
  getPaymentsReport: (params?: { fromDate?: string; toDate?: string }) => {
    return apiClient.get<unknown, PaymentReportEntry[]>('/reports/payments', { params });
  },
  getInvoicesReport: (params?: { fromDate?: string; toDate?: string }) => {
    return apiClient.get<unknown, InvoiceReportEntry[]>('/reports/invoices', { params });
  },
  getSubLedger: (params: { customerId: number; fromDate: string; toDate: string }) => {
    return apiClient.get<unknown, SubLedgerReport>('/reports/sub-ledger', { params });
  },
  getCompletedLots: (params?: {
    fromDate?: string;
    toDate?: string;
    partyName?: string;
    customerId?: number;
    qualityId?: number;
    lotNo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    return apiClient.get<unknown, CompletedLotsReport>('/reports/completed-lots', { params });
  },
  getPartyLotDelivery: (params?: {
    fromDate?: string;
    toDate?: string;
    customerId?: number;
    qualityId?: number;
    lotNo?: string;
    challanNo?: string;
    search?: string;
    status?: string;
    groupBy?: string;
    sortOrder?: string;
  }) => {
    return apiClient.get<unknown, PartyLotDeliveryReport>('/reports/party-lot-delivery', { params });
  },
  getDateWiseSales: (params?: {
    fromDate?: string;
    toDate?: string;
    customerId?: number;
    qualityId?: number;
  }) => {
    return apiClient.get<unknown, DateWiseSalesReport>('/reports/date-wise-sales', { params });
  },
};
