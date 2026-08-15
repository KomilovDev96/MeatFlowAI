import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import uzUZ from 'antd/locale/uz_UZ';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { getAntTheme } from '../styles/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();
  const antLocale = i18n.language === 'ru' ? ruRU : uzUZ;

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={getAntTheme()} locale={antLocale}>
        <AntApp>{children}</AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
