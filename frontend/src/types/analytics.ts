export type PlatformAnalytics = {
  companies: number;
  admins: number;
  clients: number;
  products: number;
};

export type CompanyAnalytics = {
  companyId: string;
  companyName: string;
  companyStatus: string;
  createdAt: string;
  clients: number;
  products: number;
  admins: number;
  sales: number;
  lastActivityAt: string | null;
};
