import { BarChart3, Building2, ClipboardList, Warehouse, LayoutDashboard, Package, ShieldCheck, UserRoundCog, Users } from 'lucide-react';
import type { Role } from '../../types/auth';

export type NavItem = {
  key: string;
  labelKey: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
};

export const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'] },
  { key: 'admins', labelKey: 'nav.admins', path: '/admins', icon: <UserRoundCog size={18} />, roles: ['SUPER_ADMIN'] },
  { key: 'companies', labelKey: 'nav.companies', path: '/companies', icon: <Building2 size={18} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'clients', labelKey: 'nav.clients', path: '/clients', icon: <Users size={18} />, roles: ['ADMIN'] },
  { key: 'orders', labelKey: 'nav.orders', path: '/orders', icon: <ClipboardList size={18} />, roles: ['ADMIN'] },
  { key: 'products', labelKey: 'nav.products', path: '/products', icon: <Package size={18} />, roles: ['ADMIN'] },
  { key: 'stock', labelKey: 'nav.stock', path: '/stock', icon: <Warehouse size={18} />, roles: ['ADMIN'] },
  { key: 'reports', labelKey: 'nav.reports', path: '/reports', icon: <BarChart3 size={18} />, roles: ['ADMIN'] },
  { key: 'profile', labelKey: 'nav.profile', path: '/profile', icon: <ShieldCheck size={18} />, roles: ['ADMIN', 'CLIENT'] },
];
