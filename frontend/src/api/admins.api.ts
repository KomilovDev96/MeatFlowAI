import type { Admin, UpdateAdminPayload } from '../types/admin';
import { apiClient } from './client';

export const adminsApi = {
  list: async () => (await apiClient.get<Admin[]>('/admins')).data,
  update: async (id: string, payload: UpdateAdminPayload) => (await apiClient.patch<Admin>(`/admins/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/admins/${id}`)).data,
};
