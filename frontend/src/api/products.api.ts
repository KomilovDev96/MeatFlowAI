import type { Product } from '../types/product';
import { apiClient } from './client';

export type ProductPayload = {
  name: string;
  description?: string;
  category?: string;
  image?: string;
  unit?: Product['unit'];
  purchasePrice?: number;
  salePrice?: number;
  stock?: number;
  status?: Product['status'];
};

export const productsApi = {
  list: async () => (await apiClient.get<Product[]>('/products')).data,
  create: async (payload: ProductPayload) => (await apiClient.post<Product>('/products', payload)).data,
  update: async (id: string, payload: Partial<ProductPayload>) => (await apiClient.patch<Product>(`/products/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/products/${id}`)).data,
};
