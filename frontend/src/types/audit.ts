export type AuditLog = {
  id: string;
  userId?: string | null;
  companyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
};
