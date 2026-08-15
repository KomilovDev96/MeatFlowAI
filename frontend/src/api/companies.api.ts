import type { Company } from '../types/company';
import { apiClient } from './client';

export type UpdateCompanyPayload = {
  name?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  currency?: string;
  measurementUnit?: Company['measurementUnit'];
  status?: Company['status'];
};

export const companiesApi = {
  list: async () => (await apiClient.get<Company[]>('/companies')).data,
  update: async (id: string, payload: UpdateCompanyPayload) => (await apiClient.patch<Company>(`/companies/${id}`, payload)).data,
  remove: async (id: string) => (await apiClient.delete<{ success: boolean }>(`/companies/${id}`)).data,
};
