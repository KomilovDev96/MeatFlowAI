import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PackagePlus } from 'lucide-react';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';

type ProductRow = { id: string; name: string; category: string; unit: string; stock: number; status: string };

const rows: ProductRow[] = [
  { id: '1', name: 'Beef', category: 'Meat', unit: 'KG', stock: 120, status: 'ACTIVE' },
  { id: '2', name: 'Sausage', category: 'Prepared', unit: 'PIECE', stock: 80, status: 'ACTIVE' },
];

const columns: ColumnsType<ProductRow> = [
  { title: 'Product', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Category', dataIndex: 'category' },
  { title: 'Unit', dataIndex: 'unit' },
  { title: 'Stock', dataIndex: 'stock', sorter: (a, b) => a.stock - b.stock },
  { title: 'Status', dataIndex: 'status' },
];

export function ProductsPage() {
  return (
    <>
      <PageHeader title="Products" description="Company-scoped product catalog foundation." actions={<Button type="primary" icon={<PackagePlus size={16} />}>Add product</Button>} />
      <DataTable data={rows} columns={columns} rowKey="id" searchKeys={['name', 'category', 'unit', 'status']} />
    </>
  );
}
