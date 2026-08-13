import { create } from 'zustand';
import type { ThemeMode } from '../styles/theme';

type UiState = {
  sidebarCollapsed: boolean;
  themeMode: ThemeMode;
  toggleSidebar: () => void;
  toggleTheme: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  themeMode: 'light',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleTheme: () => set((state) => ({ themeMode: state.themeMode === 'light' ? 'dark' : 'light' })),
}));
