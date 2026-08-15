import type { CreateSalePayload, Sale, UpdateSalePayload } from '../types/sale';
import { apiClient } from './client';

export const salesApi = {
  list: async () => (await apiClient.get<Sale[]>('/sales')).data,
  my: async () => (await apiClient.get<Sale[]>('/sales/my')).data,
  create: async (payload: CreateSalePayload) => (await apiClient.post<Sale>('/sales', payload)).data,
  update: async (id: string, payload: UpdateSalePayload) => (await apiClient.patch<Sale>(`/sales/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/sales/${id}`)).data,
};
