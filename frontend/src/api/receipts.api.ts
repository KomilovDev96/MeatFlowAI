import type { Receipt } from '../types/receipt';
import { apiClient } from './client';

export type ReceiptPayload = {
  productId: string;
  quantity: number;
  unitCost: number;
  supplier?: string;
  note?: string;
  receivedAt?: string;
};

export const receiptsApi = {
  list: async () => (await apiClient.get<Receipt[]>('/receipts')).data,
  create: async (payload: ReceiptPayload) => (await apiClient.post<Receipt>('/receipts', payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/receipts/${id}`)).data,
};
