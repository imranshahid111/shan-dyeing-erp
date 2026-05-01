import apiClient from './apiClient';

export interface Organization {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string | null;
  currency: string;
  terms: string | null;
}

export const organizationService = {
  getOrganization: () => {
    return apiClient.get<unknown, Organization>('/organization');
  },
  updateOrganization: (payload: Partial<Organization>) => {
    return apiClient.put<unknown, Organization>('/organization', payload);
  }
};
