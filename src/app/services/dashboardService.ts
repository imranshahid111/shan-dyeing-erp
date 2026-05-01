import apiClient from './apiClient';

export interface DashboardSummary {
  totalCustomers: number;
  pendingOrders: number;
  totalReceivables: number;
  todayPayments: number;
}

export const dashboardService = {
  getSummary: () => {
    return apiClient.get<unknown, DashboardSummary>('/dashboard/summary');
  },
};
