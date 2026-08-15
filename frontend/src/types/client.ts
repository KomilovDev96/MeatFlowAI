export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type Client = {
  id: string;
  companyId: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  phone2?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  avatar?: string | null;
  status: ClientStatus;
  notes?: string | null;
  login?: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
};

export type CreateClientPayload = {
  firstName: string;
  lastName?: string;
  phone: string;
  phone2?: string;
  avatar?: string;
  status?: ClientStatus;
  notes?: string;
  login?: string;
  password?: string;
};

export type UpdateClientPayload = Partial<CreateClientPayload>;
