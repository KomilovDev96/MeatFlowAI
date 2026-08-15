import axios from 'axios';
import { useAuthStore } from '../stores/auth.store';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({ baseURL });

const NO_RETRY_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(`${baseURL}/auth/refresh`, { refreshToken });
    useAuthStore.getState().setTokens(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const isRetryable = originalRequest && !originalRequest._retry && !NO_RETRY_PATHS.some((path) => originalRequest.url?.includes(path));

    if (error.response?.status === 401 && isRetryable) {
      originalRequest._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);
