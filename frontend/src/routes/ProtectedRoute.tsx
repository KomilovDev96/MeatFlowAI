import { Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore } from '../stores/auth.store';
import type { Role } from '../types/auth';

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.accessToken);

  if (!token) return <Navigate to="/login" replace />;
  if (roles?.length && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}
