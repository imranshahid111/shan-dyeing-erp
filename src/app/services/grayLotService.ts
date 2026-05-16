import apiClient from './apiClient';

export interface CreateGrayLotPayload {
  entryDate: string;
  partyName: string;
  processType: string;
  billNo: string;
  lotNo: string;
  quality: string;
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
  quality: string;
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
}

export const grayLotService = {
  getGrayLots: (search: string, page = 1, pageSize = 20) => {
    return apiClient.get<unknown, GrayLotsResponse>('/gray-lots', {
      params: { search, page, pageSize },
    });
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
  deleteGrayLot: (id: number) => {
    return apiClient.delete(`/gray-lots/${id}`);
  },
};
