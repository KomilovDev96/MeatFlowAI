import { apiClient } from './client';

export const productsApi = {
  list: async () => (await apiClient.get('/products')).data,
};
