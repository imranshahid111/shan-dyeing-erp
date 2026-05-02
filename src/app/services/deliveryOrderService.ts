import apiClient from './apiClient';

export interface DeliveryOrderItem {
  id: number;
  order_no: string;
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
  grid_data: any;
}

export const deliveryOrderService = {
  getDeliveryOrders: (status = "", page = 1, pageSize = 50, customer_id?: string | number, startDate?: string, endDate?: string, search?: string) => {
    return apiClient.get<unknown, DeliveryOrdersResponse>('/delivery-orders', {
      params: { status, page, pageSize, customer_id, startDate, endDate, search },
    });
  },
  createDeliveryOrder: (payload: CreateDeliveryOrderPayload) => {
    return apiClient.post('/delivery-orders', payload);
  },
  generateInvoice: (id: number, netAmount: number) => {
    return apiClient.put(`/delivery-orders/${id}/invoice`, { netAmount });
  },
  addPayment: (id: number, payload: any) => {
    return apiClient.post(`/delivery-orders/${id}/payment`, payload);
  }
};
