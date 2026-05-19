import apiClient from './apiClient';

export interface GatePassItem {
  id: number;
  gate_pass_no: string;
  delivery_order_id: number;
  gate_pass_date: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_mobile?: string;
  notes?: string;
  delivery_order?: {
    id: number;
    order_no: string;
    customer?: {
      id: number;
      name: string;
      customer_code: string;
    };
  };
}

export interface CreateGatePassPayload {
  delivery_order_id: number;
  gate_pass_date?: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_mobile?: string;
  notes?: string;
}

export const gatePassService = {
  getGatePasses: () => {
    return apiClient.get<unknown, GatePassItem[]>('/gate-passes');
  },
  getNextGatePassNumber: () => {
    return apiClient.get<unknown, { nextNumber: string }>('/gate-passes/next-number');
  },
  createGatePass: (payload: CreateGatePassPayload) => {
    return apiClient.post<unknown, GatePassItem>('/gate-passes', payload);
  },
  deleteGatePass: (id: number) => {
    return apiClient.delete<unknown, { success: boolean; message: string }>(`/gate-passes/${id}`);
  }
};
