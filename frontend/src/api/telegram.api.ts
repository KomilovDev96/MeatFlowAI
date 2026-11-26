import { apiClient } from './client';

export type BotConfig = {
  configured: boolean;
  running: boolean;
  botUsername: string | null;
  source: 'database' | 'env' | 'none';
  tokenMasked: string | null;
};

export const telegramApi = {
  status: async () => (await apiClient.get<{ configured: boolean; botUsername: string | null }>('/telegram/status')).data,
  botConfig: async () => (await apiClient.get<BotConfig>('/telegram/bot')).data,
  setToken: async (token: string) => (await apiClient.put<BotConfig>('/telegram/bot', { token })).data,
  removeToken: async () => (await apiClient.delete<BotConfig>('/telegram/bot')).data,
};
