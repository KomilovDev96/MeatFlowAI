export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT';

export type CurrentUser = {
  id: string;
  role: Role;
  fullName: string;
  login: string;
  companyId?: string | null;
  avatar?: string | null;
};

export type AuthResponse = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};
