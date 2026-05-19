import apiClient from './apiClient';

export interface UserItem {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  createdAt: string;
}

export const userService = {
  getUsers: () => {
    return apiClient.get<unknown, UserItem[]>('/users');
  },
  getUser: (id: number | string) => {
    return apiClient.get<unknown, any>(`/users/${id}`);
  },
  createUser: (payload: any) => {
    return apiClient.post<unknown, UserItem>('/users', payload);
  },
  updateUser: (id: number | string, payload: any) => {
    return apiClient.put<unknown, any>(`/users/${id}`, payload);
  },
  deleteUser: (id: number) => {
    return apiClient.delete(`/users/${id}`);
  },
};
