export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type Company = {
  id: string;
  name: string;
  avatar?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  currency: string;
  measurementUnit: 'KG' | 'PIECE';
  latitude?: number | null;
  longitude?: number | null;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
};
