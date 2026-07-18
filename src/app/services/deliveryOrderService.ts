import apiClient from './apiClient';

export interface DeliveryOrderItem {
  id: number;
  order_no: string;
  invoice_no?: string;
  customer_id: number;
  order_date: string;
  status: string;
  total_amount: string | number;
  paid_amount: string | number;
  customer?: {
    id: number;
    name: string;
    customer_code: string;
  };
  gray_lot?: {
    lot_no: string;
  };
  total_gray_gazana: string | number;
  total_ready_gazana: string | number;
  rate?: number;
  rate_unit?: string;
  kinar_cut_amount?: string | number;
  packing_amount?: string | number;
  packing_qty?: string | number;
  grid_data?: any;
}

export interface DeliveryOrdersResponse {
  page: number;
  pageSize: number;
  total: number;
  data: DeliveryOrderItem[];
}

export interface CreateDeliveryOrderPayload {
  gray_lot_id: number;
  total_gray_gazana: number;
  total_ready_gazana: number;
  grid_data: any;
}

export const deliveryOrderService = {
  getDeliveryOrders: (status = "", page = 1, pageSize = 50, customer_id?: string | number, startDate?: string, endDate?: string, search?: string) => {
    return apiClient.get<unknown, DeliveryOrdersResponse>('/delivery-orders', {
      params: { status, page, pageSize, customer_id, startDate, endDate, search },
    });
  },
  getDeliveryOrderById: (id: string | number) => {
    return apiClient.get<unknown, DeliveryOrderItem & { grid_data: any }>(`/delivery-orders/${id}`);
  },
  createDeliveryOrder: (payload: CreateDeliveryOrderPayload) => {
    return apiClient.post('/delivery-orders', payload);
  },
  updateDeliveryOrder: (id: string | number, payload: CreateDeliveryOrderPayload) => {
    return apiClient.put(`/delivery-orders/${id}`, payload);
  },
  generateInvoice: (id: number, netAmount: number, rate: number, rateUnit: string, kinarCutAmount: number = 0, packingAmount: number = 0, kinarCutQty?: number, packingQty?: number) => {
    return apiClient.put(`/delivery-orders/${id}/invoice`, { netAmount, rate, rateUnit, kinarCutAmount, packingAmount, kinarCutQty, packingQty });
  },
  addPayment: (id: number, payload: any) => {
    return apiClient.post(`/delivery-orders/${id}/payment`, payload);
  },
  markAsPaid: (id: number) => {
    return apiClient.put(`/delivery-orders/${id}/paid`);
  },
  deleteInvoice: (id: number) => {
    return apiClient.delete(`/delivery-orders/${id}/invoice`);
  },
  deleteDeliveryOrder: (id: number) => {
    return apiClient.delete(`/delivery-orders/${id}`);
  }
};
