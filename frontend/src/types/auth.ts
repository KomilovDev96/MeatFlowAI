export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';

export type CurrentUser = {
  id: string;
  role: Role;
  firstName: string;
  lastName?: string | null;
  login: string;
  phone?: string | null;
  phone2?: string | null;
  status?: string;
  companyId?: string | null;
  company?: { name: string; avatar?: string | null } | null;
  avatar?: string | null;
  lastLoginAt?: string | null;
};

export type AuthResponse = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};
