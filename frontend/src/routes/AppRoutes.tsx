import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { AdminsPage } from '../features/admins/AdminsPage';
import { ClientDashboardPage } from '../features/client/ClientDashboardPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { CompaniesPage } from '../features/companies/CompaniesPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AdminDashboardPage } from '../features/products/AdminDashboardPage';
import { ProductsPage } from '../features/products/ProductsPage';
import { SuperAdminDashboardPage } from '../features/super-admin/SuperAdminDashboardPage';
import { TelegramOrderPage } from '../features/telegram-app/TelegramOrderPage';
import { useAuthStore } from '../stores/auth.store';
import { ProtectedRoute } from './ProtectedRoute';

function DashboardRouter() {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'SUPER_ADMIN') return <SuperAdminDashboardPage />;
  if (role === 'CLIENT') return <ClientDashboardPage />;
  return <AdminDashboardPage />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tg/orders/new" element={<TelegramOrderPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
        <Route path="/admins" element={<ProtectedRoute roles={['SUPER_ADMIN']}><AdminsPage /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute roles={['SUPER_ADMIN', 'ADMIN']}><CompaniesPage /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute roles={['ADMIN']}><ClientsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['ADMIN']}><OrdersPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute roles={['ADMIN']}><ProductsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['ADMIN', 'CLIENT']}><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
