import type { Company } from './company';

export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type Admin = {
  id: string;
  firstName: string;
  lastName?: string | null;
  login: string;
  phone?: string | null;
  avatar?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramConnected: boolean;
  status: AdminStatus;
  companyId?: string | null;
  company?: Company | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
};

export type CreateAdminPayload = {
  firstName: string;
  lastName?: string;
  avatar?: string;
  login: string;
  password: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;
  status?: AdminStatus;
  companyName: string;
  companyLogo?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLatitude?: number;
  companyLongitude?: number;
  companyCurrency?: string;
  companyMeasurementUnit?: Company['measurementUnit'];
};

export type UpdateAdminPayload = {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;
  status?: AdminStatus;
};
