import type { ColumnsType } from 'antd/es/table';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';

type CompanyRow = { id: string; name: string; phone: string; status: string; currency: string };

const rows: CompanyRow[] = [
  { id: '1', name: 'Demo Meat Company', phone: '+998901112233', status: 'ACTIVE', currency: 'UZS' },
];

const columns: ColumnsType<CompanyRow> = [
  { title: 'Company', dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: 'Phone', dataIndex: 'phone' },
  { title: 'Currency', dataIndex: 'currency' },
  { title: 'Status', dataIndex: 'status' },
];

export function CompaniesPage() {
  return (
    <>
      <PageHeader title="Companies" description="Company registry and status foundation." />
      <DataTable data={rows} columns={columns} rowKey="id" searchKeys={['name', 'phone', 'status']} />
    </>
  );
}
