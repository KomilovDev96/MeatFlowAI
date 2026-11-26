import type { ReportSummary } from '../types/receipt';
import { apiClient } from './client';

export const reportsApi = {
  summary: async (params: { from?: string; to?: string }) => (await apiClient.get<ReportSummary>('/reports/summary', { params })).data,
};
