import type { CompanyAnalytics, PlatformAnalytics } from '../types/analytics';
import { apiClient } from './client';

export const analyticsApi = {
  platform: async () => (await apiClient.get<PlatformAnalytics>('/analytics/platform')).data,
  company: async (companyId: string) => (await apiClient.get<CompanyAnalytics>(`/analytics/companies/${companyId}`)).data,
};
