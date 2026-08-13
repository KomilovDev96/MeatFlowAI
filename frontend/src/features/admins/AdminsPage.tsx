import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus } from 'lucide-react';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';

type AdminRow = { id: string; fullName: string; login: string; status: string; company?: { name: string } };

const rows: AdminRow[] = [
  { id: '1', fullName: 'Demo Admin', login: 'admin', status: 'ACTIVE', company: { name: 'Demo Meat Company' } },
];

const columns: ColumnsType<AdminRow> = [
  { title: 'Name', dataIndex: 'fullName', sorter: (a, b) => a.fullName.localeCompare(b.fullName) },
  { title: 'Login', dataIndex: 'login' },
  { title: 'Company', render: (_, row) => row.company?.name },
  { title: 'Status', dataIndex: 'status' },
];

export function AdminsPage() {
  return (
    <>
      <PageHeader title="Admins" description="SuperAdmin management foundation." actions={<Button type="primary" icon={<Plus size={16} />}>Create admin</Button>} />
      <DataTable data={rows} columns={columns} rowKey="id" searchKeys={['fullName', 'login', 'status']} />
    </>
  );
}
