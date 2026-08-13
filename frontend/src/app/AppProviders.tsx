import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import type { PropsWithChildren } from 'react';
import { useUiStore } from '../stores/ui.store';
import { getAntTheme } from '../styles/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const themeMode = useUiStore((state) => state.themeMode);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          ...getAntTheme(themeMode),
          algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        }}
      >
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
