import { Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UserPlus } from 'lucide-react';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';

type ClientRow = { id: string; firstName: string; lastName?: string; phone?: string; status: string };

const rows: ClientRow[] = [
  { id: '1', firstName: 'Ali', lastName: 'Karimov', phone: '+998901010101', status: 'ACTIVE' },
  { id: '2', firstName: 'Vali', lastName: 'Nazarov', phone: '+998902020202', status: 'ACTIVE' },
];

const columns: ColumnsType<ClientRow> = [
  { title: 'First name', dataIndex: 'firstName' },
  { title: 'Last name', dataIndex: 'lastName' },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Status', dataIndex: 'status' },
];

export function ClientsPage() {
  return (
    <>
      <PageHeader title="Clients" description="Company-scoped client workspace." actions={<Button type="primary" icon={<UserPlus size={16} />}>Add client</Button>} />
      <DataTable data={rows} columns={columns} rowKey="id" searchKeys={['firstName', 'lastName', 'phone', 'status']} />
    </>
  );
}
