import { useQuery } from '@tanstack/react-query';
import { Button, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { companiesApi } from '../../api/companies.api';
import { statusLabel } from '../../lib/labels';
import { useAuthStore } from '../../stores/auth.store';
import type { Company } from '../../types/company';
import { CompanyDetailDrawer } from './CompanyDetailDrawer';
import { DeleteCompanyModal } from './DeleteCompanyModal';
import { EditCompanyModal } from './EditCompanyModal';

export function CompaniesPage() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role);
  const { data, isLoading } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const columns: ColumnsType<Company> = [
    { title: t('companies.colName'), dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: t('companies.colPhone'), dataIndex: 'phone' },
    { title: t('companies.colAddress'), dataIndex: 'address' },
    { title: t('companies.colCurrency'), dataIndex: 'currency' },
    { title: t('companies.colStatus'), dataIndex: 'status', render: statusLabel },
    {
      title: t('companies.colActions'),
      key: 'actions',
      render: (_, row) => (
        <Space>
          <Button size="small" icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); setEditingCompany(row); }}>
            {t('common.edit')}
          </Button>
          {role === 'SUPER_ADMIN' && (
            <Button size="small" danger icon={<Trash2 size={14} />} onClick={(e) => { e.stopPropagation(); setDeletingCompany(row); }}>
              {t('common.delete')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('companies.title')} description={t('companies.description')} />
      <DataTable data={data ?? []} columns={columns} rowKey="id" searchKeys={['name', 'phone', 'status']} loading={isLoading} onRowClick={setViewingCompany} />
      <DeleteCompanyModal open={deletingCompany != null} onClose={() => setDeletingCompany(null)} company={deletingCompany} />
      <CompanyDetailDrawer open={viewingCompany != null} onClose={() => setViewingCompany(null)} company={viewingCompany} />
      <EditCompanyModal open={editingCompany != null} onClose={() => setEditingCompany(null)} company={editingCompany} />
    </>
  );
}
