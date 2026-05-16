import apiClient from './apiClient';

export interface PaymentItem {
  id: number;
  delivery_order_id: number;
  payment_date: string;
  amount: string | number;
  mode: string;
  reference_no: string | null;
  notes: string | null;
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
  getPayments: (search = "", page = 1, pageSize = 50) => {
    return apiClient.get<unknown, PaymentsResponse>('/payments', {
      params: { search, page, pageSize }
    });
  },
  getPaymentStats: () => {
    return apiClient.get<unknown, PaymentStats>('/payments/stats');
  }
};
