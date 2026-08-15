import { apiClient } from './client';

export const telegramApi = {
  status: async () => (await apiClient.get<{ configured: boolean; botUsername: string | null }>('/telegram/status')).data,
};
