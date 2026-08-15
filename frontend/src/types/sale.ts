import type { Client } from './client';
import type { Product } from './product';

export type SaleType = 'CASH' | 'CONSIGNMENT';

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  product: Product;
  quantityPieces: string;
  quantityKg: string;
  pricePerKg: string;
  totalAmount: string;
};

export type Sale = {
  id: string;
  orderNumber: number;
  companyId: string;
  clientId: string;
  client: Client;
  items: SaleItem[];
  totalAmount: string;
  type: SaleType;
  soldAt: string;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
};

export type SaleItemPayload = {
  productId: string;
  quantityPieces: number;
  quantityKg: number;
  pricePerKg?: number;
};

export type CreateSalePayload = {
  clientId: string;
  items: SaleItemPayload[];
  type?: SaleType;
  soldAt?: string;
  note?: string;
};

export type UpdateSalePayload = {
  items?: SaleItemPayload[];
  type?: SaleType;
  soldAt?: string;
  note?: string;
  isPaid?: boolean;
};
