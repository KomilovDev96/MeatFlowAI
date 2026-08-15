import type { CreateAdminPayload } from '../types/admin';
import { apiClient } from './client';

export const superAdminApi = {
  createAdmin: async (payload: CreateAdminPayload) => (await apiClient.post('/super-admin/admins', payload)).data,
};
