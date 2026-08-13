import { apiClient } from './client';

export const companiesApi = {
  list: async () => (await apiClient.get('/companies')).data,
};
