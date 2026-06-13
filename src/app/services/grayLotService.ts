import apiClient from './apiClient';

export interface CreateGrayLotPayload {
  entryDate: string;
  partyName: string;
  processType: string;
  billNo: string;
  lotNo: string;
  qualityId: number;
  measurement: string;
  than: number;
  gazana: number;
  notes: string;
}

export interface GrayLotItem {
  id: number;
  entry_date: string;
  party_name: string;
  process_type: string;
  bill_no: string;
  lot_no: string;
  quality_id: number;
  quality?: { id: number; name: string };
  measurement: string;
  than: number;
  gazana: number;
  notes: string | null;
}

export interface GrayLotsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: GrayLotItem[];
}

export interface DeliveryLotOption {
  id: number;
  lotNo: string;
  partyName: string;
  process: string;
  totalGray: number;
  remaining: number;
  returned?: number;
}

export const grayLotService = {
  getGrayLots: (search: string, page = 1, pageSize = 20) => {
    return apiClient.get<unknown, GrayLotsResponse>('/gray-lots', {
      params: { search, page, pageSize },
    });
  },
  getGrayLot: (id: number | string) => {
    return apiClient.get<unknown, any>(`/gray-lots/${id}`);
  },
  getLotsWithBalance: () => {
    return apiClient.get<unknown, DeliveryLotOption[]>('/gray-lots/balances');
  },
  getNextLotNumber: () => {
    return apiClient.get<unknown, { nextLotNo: string }>('/gray-lots/next-number');
  },
  createGrayLot: (payload: CreateGrayLotPayload) => {
    return apiClient.post('/gray-lots', payload);
  },
  updateGrayLot: (id: number | string, payload: any) => {
    return apiClient.put(`/gray-lots/${id}`, payload);
  },
  deleteGrayLot: (id: number) => {
    return apiClient.delete(`/gray-lots/${id}`);
  },
};
