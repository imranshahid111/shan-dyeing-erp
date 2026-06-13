import apiClient from './apiClient';

export interface GatePassDOItem {
  id?: number;
  gate_pass_id?: number;
  delivery_order_id: number;
  description?: string;
  bundles?: number;
  gazana_total?: number;
  delivery_order?: {
    id: number;
    order_no: string;
    total_gray_gazana?: string | number;
    total_ready_gazana?: string | number;
    customer?: { id: number; name: string; customer_code: string };
    gray_lot?: { id: number; lot_no: string; party_name: string };
  };
}

export interface GatePassItem {
  id: number;
  gate_pass_no: string;
  gate_pass_date: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_mobile?: string;
  notes?: string;
  items: GatePassDOItem[];
}

export interface CreateGatePassPayload {
  gate_pass_date?: string;
  vehicle_no?: string;
  driver_name?: string;
  driver_mobile?: string;
  notes?: string;
  items: {
    delivery_order_id: number;
    order_no?: string;
    description?: string;
    bundles?: number;
    gazana_total?: number;
  }[];
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
