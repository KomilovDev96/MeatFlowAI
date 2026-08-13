import { apiClient } from './client';

export const analyticsApi = {
  platform: async () => (await apiClient.get('/analytics/platform')).data,
  company: async (companyId: string) => (await apiClient.get(`/analytics/companies/${companyId}`)).data,
};
