import type { Client, CreateClientPayload, UpdateClientPayload } from '../types/client';
import { apiClient } from './client';

export const clientsApi = {
  list: async () => (await apiClient.get<Client[]>('/clients')).data,
  create: async (payload: CreateClientPayload) => (await apiClient.post<Client>('/clients', payload)).data,
  update: async (id: string, payload: UpdateClientPayload) => (await apiClient.patch<Client>(`/clients/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/clients/${id}`)).data,
  getTelegramCode: async (id: string) => (await apiClient.post<{ code: string; expiresAt: string }>(`/clients/${id}/telegram-code`)).data,
};
