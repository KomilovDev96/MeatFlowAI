import type { AuthResponse, CurrentUser } from '../types/auth';
import { apiClient } from './client';

export const authApi = {
  async login(payload: { login: string; password: string }) {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
    return data;
  },
  async me() {
    const { data } = await apiClient.get<CurrentUser>('/auth/me');
    return data;
  },
  async logout() {
    const { data } = await apiClient.post<{ success: boolean }>('/auth/logout');
    return data;
  },
  async telegramWebAppLogin(initData: string) {
    const { data } = await apiClient.post<AuthResponse>('/auth/telegram-webapp', { initData });
    return data;
  },
  async getTelegramCode() {
    const { data } = await apiClient.post<{ code: string; expiresAt: string }>('/auth/telegram-code');
    return data;
  },
};
