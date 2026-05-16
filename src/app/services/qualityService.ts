import apiClient from './apiClient';

export interface QualityItem {
  id: number;
  name: string;
}

export const qualityService = {
  getQualities: () => {
    return apiClient.get('/qualities');
  },
  createQuality: (name: string) => {
    return apiClient.post('/qualities', { name });
  },
  updateQuality: (id: number, name: string) => {
    return apiClient.put(`/qualities/${id}`, { name });
  },
  deleteQuality: (id: number) => {
    return apiClient.delete(`/qualities/${id}`);
  }
};
