import { Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { OrderFormModal } from '../clients/OrderFormModal';

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData: string; ready: () => void; expand: () => void; close: () => void } };
  }
}

function loadTelegramScript(): Promise<void> {
  if (window.Telegram?.WebApp) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('script-load-failed'));
    document.head.appendChild(script);
  });
}

export function TelegramOrderPage() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadTelegramScript();
        const webApp = window.Telegram?.WebApp;
        if (!webApp?.initData) throw new Error('not-in-telegram');
        webApp.ready();
        webApp.expand();
        const session = await authApi.telegramWebAppLogin(webApp.initData);
        if (cancelled) return;
        setSession(session);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  const close = () => {
    setClosed(true);
    window.Telegram?.WebApp?.close();
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message={t('telegramApp.authFailedTitle')} description={t('telegramApp.authFailedDescription')} />
      </div>
    );
  }

  if (closed) return null;

  return <OrderFormModal open onClose={close} />;
}
