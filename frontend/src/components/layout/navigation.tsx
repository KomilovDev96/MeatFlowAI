import { BarChart3, Building2, ClipboardList, LayoutDashboard, Package, ShieldCheck, UserRoundCog, Users } from 'lucide-react';
import type { Role } from '../../types/auth';

export type NavItem = {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Role[];
};

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} />, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'] },
  { key: 'admins', label: 'Admins', path: '/admins', icon: <UserRoundCog size={18} />, roles: ['SUPER_ADMIN'] },
  { key: 'companies', label: 'Companies', path: '/companies', icon: <Building2 size={18} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'clients', label: 'Clients', path: '/clients', icon: <Users size={18} />, roles: ['ADMIN'] },
  { key: 'products', label: 'Products', path: '/products', icon: <Package size={18} />, roles: ['ADMIN'] },
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: <BarChart3 size={18} />, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { key: 'audit', label: 'Audit Logs', path: '/audit', icon: <ClipboardList size={18} />, roles: ['SUPER_ADMIN'] },
  { key: 'profile', label: 'Profile', path: '/profile', icon: <ShieldCheck size={18} />, roles: ['ADMIN', 'CLIENT'] },
];
