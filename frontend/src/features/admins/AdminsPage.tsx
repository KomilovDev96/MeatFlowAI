import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminsApi } from '../../api/admins.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { displayName } from '../../lib/format';
import { statusLabel } from '../../lib/labels';
import type { Admin } from '../../types/admin';
import { AdminDetailDrawer } from './AdminDetailDrawer';
import { AdminFormModal } from './AdminFormModal';

export function AdminsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<Admin | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['admins'], queryFn: adminsApi.list });

  const removeMutation = useMutation({
    mutationFn: (id: string) => adminsApi.remove(id),
    onSuccess: () => {
      message.success(t('admins.deletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('admins.deleteFailed');
      message.error(description);
    },
  });

  const openCreate = () => {
    setEditingAdmin(null);
    setModalOpen(true);
  };

  const openEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setModalOpen(true);
  };

  const columns: ColumnsType<Admin> = [
    { title: t('admins.colName'), dataIndex: 'firstName', render: (_, row) => displayName(row), sorter: (a, b) => displayName(a).localeCompare(displayName(b)) },
    { title: t('admins.colLogin'), dataIndex: 'login' },
    { title: t('admins.colPhone'), dataIndex: 'phone' },
    { title: t('admins.colCompany'), render: (_, row) => row.company?.name },
    { title: t('admins.colStatus'), dataIndex: 'status', render: statusLabel },
    {
      title: t('clients.colActions'),
      key: 'actions',
      render: (_, row) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button size="small" icon={<Pencil size={14} />} onClick={() => openEdit(row)}>
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('admins.deleteConfirmTitle')}
            description={t('admins.deleteConfirmDesc')}
            okText={t('common.delete')}
            cancelText={t('common.cancel')}
            onConfirm={() => removeMutation.mutate(row.id)}
          >
            <Button size="small" danger icon={<Trash2 size={14} />} loading={removeMutation.isPending && removeMutation.variables === row.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('admins.title')}
        description={t('admins.description')}
        actions={
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {t('admins.createButton')}
          </Button>
        }
      />
      <DataTable data={data ?? []} columns={columns} rowKey="id" searchKeys={['login', 'phone', 'status']} loading={isLoading} onRowClick={setViewingAdmin} />
      <AdminFormModal open={modalOpen} onClose={() => setModalOpen(false)} admin={editingAdmin} />
      <AdminDetailDrawer open={viewingAdmin != null} onClose={() => setViewingAdmin(null)} admin={viewingAdmin} />
    </>
  );
}
