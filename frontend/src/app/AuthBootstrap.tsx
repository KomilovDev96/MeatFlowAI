import { Spin } from 'antd';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/auth.store';

export function AuthBootstrap({ children }: PropsWithChildren) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [checking, setChecking] = useState(Boolean(accessToken) && !user);

  useEffect(() => {
    if (!accessToken || user) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => clearSession())
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return <>{children}</>;
}
