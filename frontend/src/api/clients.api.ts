import { apiClient } from './client';

export const clientsApi = {
  list: async () => (await apiClient.get('/clients')).data,
};
