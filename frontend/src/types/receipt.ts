export type Receipt = {
  id: string;
  productId: string;
  product: { id: string; name: string; unit: 'KG' | 'PIECE' };
  quantity: string;
  unitCost: string;
  totalCost: string;
  supplier?: string | null;
  note?: string | null;
  receivedAt: string;
};

export type ReportItem = {
  productId: string;
  name: string;
  unit: 'KG' | 'PIECE';
  stock: string;
  stockValue: string;
  received: string;
  receivedCost: string;
  sold: string;
  revenue: string;
  cost: string;
  profit: string;
};

export type ReportSummary = {
  from: string | null;
  to: string | null;
  totals: {
    salesCount: number;
    receiptsCount: number;
    revenue: string;
    cost: string;
    profit: string;
    marginPercent: string;
    receivedCost: string;
    stockValue: string;
    unpaidSales: string;
  };
  items: ReportItem[];
};
