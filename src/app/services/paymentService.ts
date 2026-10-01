import apiClient from './apiClient';

export interface PaymentItem {
  id: number;
  delivery_order_id: number;
  customer_id?: number;
  payment_date: string;
  amount: string | number;
  mode: string;
  reference_no: string | null;
  notes: string | null;
  attachment?: string | null;
  attachment_name?: string | null;
  customer?: { id: number; name: string };
  delivery_order?: {
    id: number;
    order_no: string;
    customer?: {
      id: number;
      name: string;
    };
  };
}

export interface PaymentsResponse {
  page: number;
  pageSize: number;
  total: number;
  data: PaymentItem[];
}

export interface PaymentStats {
  monthlyCollection: number;
  pendingInvoices: number;
  totalOutstanding: number;
}

export const paymentService = {
  getPayments: (search = "", page = 1, pageSize = 50, customerId?: number | null, startDate?: string, endDate?: string) => {
    return apiClient.get<unknown, PaymentsResponse>('/payments', {
      params: { 
        search, 
        page, 
        pageSize, 
        ...(customerId ? { customer_id: customerId } : {}),
        ...(startDate ? { startDate, fromDate: startDate, start_date: startDate } : {}),
        ...(endDate ? { endDate, toDate: endDate, end_date: endDate } : {})
      }
    });
  },
  getPaymentStats: () => {
    return apiClient.get<unknown, PaymentStats>('/payments/stats');
  },
  deletePayment: (id: number) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/payments/${id}`);
  },
  updatePayment: (id: number, data: any) => {
    return apiClient.put<{ success: boolean; message: string; data: any }>(`/payments/${id}`, data);
  }
};
