import apiClient from './apiClient';

export interface ActivityLogItem {
  id: number;
  module: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
  createdAt?: string;
}

export interface ActivityLogsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: ActivityLogItem[];
}

export const activityLogService = {
  getActivityLogs: (page = 1, pageSize = 50) => {
    return apiClient.get<unknown, ActivityLogsResponse>('/activity-logs', {
      params: { page, pageSize },
    });
  },
};
