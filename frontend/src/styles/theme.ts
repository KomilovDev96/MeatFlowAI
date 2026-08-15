import type { ThemeConfig } from 'antd';
import { tokens } from './tokens';

export function getAntTheme(): ThemeConfig {
  return {
    token: {
      colorPrimary: tokens.color.primary,
      colorSuccess: tokens.color.success,
      colorWarning: tokens.color.warning,
      colorError: tokens.color.error,
      colorInfo: tokens.color.info,
      colorBgLayout: tokens.color.background,
      colorBgContainer: tokens.color.surface,
      colorBorder: tokens.color.border,
      colorText: tokens.color.text,
      colorTextSecondary: tokens.color.muted,
      borderRadius: tokens.radius.md,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    components: {
      Layout: {
        headerBg: tokens.color.surface,
        siderBg: tokens.color.surface,
      },
      Card: {
        borderRadiusLG: tokens.radius.md,
      },
    },
  };
}
