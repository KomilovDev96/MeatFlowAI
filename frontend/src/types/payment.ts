import type { Client } from './client';

export type PaymentMethod = 'CASH' | 'TRANSFER';

export type Payment = {
  id: string;
  companyId: string;
  clientId: string;
  client?: Client;
  amount: string;
  method: PaymentMethod;
  currency: string;
  note?: string | null;
  paidAt: string;
  createdAt: string;
};

export type CreatePaymentPayload = {
  clientId: string;
  amount: number;
  method?: PaymentMethod;
  currency?: string;
  note?: string;
  paidAt?: string;
};

export type DebtSummary = {
  ordersDebt: string;
  totalPaid: string;
  qarz: string;
  balans: string;
};
