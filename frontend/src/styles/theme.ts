import type { ThemeConfig } from 'antd';
import { tokens } from './tokens';

export type ThemeMode = 'light' | 'dark';

export function getAntTheme(mode: ThemeMode): ThemeConfig {
  const dark = mode === 'dark';
  return {
    token: {
      colorPrimary: tokens.color.primary,
      colorSuccess: tokens.color.success,
      colorWarning: tokens.color.warning,
      colorError: tokens.color.error,
      colorInfo: tokens.color.info,
      colorBgLayout: dark ? tokens.color.darkBackground : tokens.color.background,
      colorBgContainer: dark ? tokens.color.darkSurface : tokens.color.surface,
      colorBorder: dark ? tokens.color.darkBorder : tokens.color.border,
      colorText: dark ? tokens.color.darkText : tokens.color.text,
      colorTextSecondary: dark ? tokens.color.darkMuted : tokens.color.muted,
      borderRadius: tokens.radius.md,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    components: {
      Layout: {
        headerBg: dark ? tokens.color.darkSurface : tokens.color.surface,
        siderBg: dark ? tokens.color.darkSurface : tokens.color.surface,
      },
      Card: {
        borderRadiusLG: tokens.radius.md,
      },
    },
  };
}
