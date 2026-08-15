import { create } from 'zustand';
import type { CurrentUser } from '../types/auth';

type AuthState = {
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: { user: CurrentUser; accessToken: string; refreshToken: string }) => void;
  setUser: (user: CurrentUser) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem('meatflow.accessToken'),
  refreshToken: localStorage.getItem('meatflow.refreshToken'),
  setSession: (session) => {
    localStorage.setItem('meatflow.accessToken', session.accessToken);
    localStorage.setItem('meatflow.refreshToken', session.refreshToken);
    set(session);
  },
  setUser: (user) => set({ user }),
  setTokens: (tokens) => {
    localStorage.setItem('meatflow.accessToken', tokens.accessToken);
    localStorage.setItem('meatflow.refreshToken', tokens.refreshToken);
    set(tokens);
  },
  clearSession: () => {
    localStorage.removeItem('meatflow.accessToken');
    localStorage.removeItem('meatflow.refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
