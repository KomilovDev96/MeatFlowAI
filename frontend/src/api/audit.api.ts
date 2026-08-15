import type { AuditLog } from '../types/audit';
import { apiClient } from './client';

export const auditApi = {
  list: async () => (await apiClient.get<AuditLog[]>('/audit')).data,
};
