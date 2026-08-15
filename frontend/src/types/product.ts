export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  unit: 'KG' | 'PIECE';
  purchasePrice: string;
  salePrice: string;
  stock: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};
