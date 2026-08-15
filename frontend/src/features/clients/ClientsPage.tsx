import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clientsApi } from '../../api/clients.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { displayName } from '../../lib/format';
import { statusLabel } from '../../lib/labels';
import type { Client } from '../../types/client';
import { ClientDetailDrawer } from './ClientDetailDrawer';
import { ClientFormModal } from './ClientFormModal';

export function ClientsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['clients'], queryFn: clientsApi.list });

  const removeMutation = useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: () => {
      message.success(t('clients.deletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('clients.deleteFailed');
      message.error(description);
    },
  });

  const openCreate = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const columns: ColumnsType<Client> = [
    { title: t('clients.colName'), dataIndex: 'firstName', render: (_, row) => displayName(row), sorter: (a, b) => displayName(a).localeCompare(displayName(b)) },
    { title: t('clients.colPhone'), dataIndex: 'phone' },
    { title: t('clients.colPhone2'), dataIndex: 'phone2', render: (value) => value ?? t('common.notSpecified') },
    { title: t('clients.colStatus'), dataIndex: 'status', render: statusLabel },
    { title: t('clients.colAppAccess'), dataIndex: 'login', render: (value) => (value ? <Tag color="blue">{value}</Tag> : <Tag>{t('clients.notIssued')}</Tag>) },
    {
      title: t('clients.colActions'),
      key: 'actions',
      render: (_, row) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button size="small" icon={<Pencil size={14} />} onClick={() => openEdit(row)}>
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('clients.deleteConfirmTitle')}
            description={t('clients.deleteConfirmDesc')}
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
        title={t('clients.title')}
        description={t('clients.description')}
        actions={
          <Button type="primary" icon={<UserPlus size={16} />} onClick={openCreate}>
            {t('clients.addButton')}
          </Button>
        }
      />
      <DataTable data={data ?? []} columns={columns} rowKey="id" searchKeys={['firstName', 'lastName', 'phone', 'status']} loading={isLoading} onRowClick={setViewingClient} />
      <ClientFormModal open={modalOpen} onClose={() => setModalOpen(false)} client={editingClient} />
      <ClientDetailDrawer open={viewingClient != null} onClose={() => setViewingClient(null)} client={viewingClient} />
    </>
  );
}
