import { apiClient } from './client';

export const adminsApi = {
  list: async () => (await apiClient.get('/admins')).data,
};
