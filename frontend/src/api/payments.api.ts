import type { CreatePaymentPayload, DebtSummary, Payment } from '../types/payment';
import { apiClient } from './client';

export const paymentsApi = {
  list: async () => (await apiClient.get<Payment[]>('/payments')).data,
  my: async () => (await apiClient.get<Payment[]>('/payments/my')).data,
  mySummary: async () => (await apiClient.get<DebtSummary>('/payments/my/summary')).data,
  summary: async (clientId: string) => (await apiClient.get<DebtSummary>(`/payments/summary/${clientId}`)).data,
  create: async (payload: CreatePaymentPayload) => (await apiClient.post<Payment>('/payments', payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/payments/${id}`)).data,
};
