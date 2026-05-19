import apiClient from './apiClient';

export interface CustomerItem {
  id: number;
  customer_code: string;
  name: string;
  phone: string;
  city: string | null;
  outstanding_amount: string | number;
}

export interface CustomersResponse {
  page: number;
  pageSize: number;
  total: number;
  data: CustomerItem[];
}

export interface CreateCustomerPayload {
  customerCode: string;
  name: string;
  mobile: string;
  address: string;
  creditLimit?: number;
  outstanding?: number;
}

export const customerService = {
  getCustomers: (search: string, page = 1, pageSize = 20) => {
    return apiClient.get<unknown, CustomersResponse>('/customers', {
      params: { search, page, pageSize },
    });
  },
  createCustomer: (payload: CreateCustomerPayload) => {
    return apiClient.post<unknown, CustomerItem>('/customers', payload);
  },
  getCustomer: (id: string) => {
    return apiClient.get<unknown, any>(`/customers/${id}`);
  },
  updateCustomer: (id: number | string, payload: any) => {
    return apiClient.put(`/customers/${id}`, payload);
  },
  addBulkPayment: (id: number | string, payload: any) => {
    return apiClient.post<unknown, any>(`/customers/${id}/bulk-payment`, payload);
  },
};
