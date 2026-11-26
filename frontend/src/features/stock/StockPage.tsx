import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PackagePlus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { receiptsApi } from '../../api/receipts.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatNumber } from '../../lib/format';
import { unitLabel } from '../../lib/labels';
import type { Receipt } from '../../types/receipt';
import { ReceiptFormModal } from './ReceiptFormModal';

export function StockPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['receipts'], queryFn: receiptsApi.list });

  const removeMutation = useMutation({
    mutationFn: (id: string) => receiptsApi.remove(id),
    onSuccess: () => {
      message.success(t('stock.deletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
    },
    onError: (error: unknown) => {
      message.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('stock.deleteFailed'));
    },
  });

  const columns: ColumnsType<Receipt> = [
    { title: t('stock.date'), dataIndex: 'receivedAt', sorter: (a, b) => a.receivedAt.localeCompare(b.receivedAt), render: (v) => dayjs(v).format('DD.MM.YYYY HH:mm') },
    { title: t('stock.product'), dataIndex: ['product', 'name'] },
    { title: t('stock.quantity'), dataIndex: 'quantity', render: (v, row) => `${formatNumber(v)} ${unitLabel(row.product.unit)}` },
    { title: t('stock.unitCost'), dataIndex: 'unitCost', render: (v) => formatNumber(v) },
    { title: t('stock.total'), dataIndex: 'totalCost', sorter: (a, b) => Number(a.totalCost) - Number(b.totalCost), render: (v) => formatNumber(v) },
    { title: t('stock.supplier'), dataIndex: 'supplier', render: (v) => v ?? t('common.notSpecified') },
    {
      title: '',
      key: 'actions',
      render: (_, row) => (
        <Popconfirm title={t('stock.deleteConfirm')} okText={t('common.delete')} cancelText={t('common.cancel')} onConfirm={() => removeMutation.mutate(row.id)}>
          <Button size="small" danger icon={<Trash2 size={14} />} loading={removeMutation.isPending && removeMutation.variables === row.id} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('stock.title')}
        description={t('stock.description')}
        actions={
          <Button type="primary" icon={<PackagePlus size={16} />} onClick={() => setOpen(true)}>
            {t('stock.addButton')}
          </Button>
        }
      />
      <DataTable data={data ?? []} columns={columns} rowKey="id" searchKeys={['supplier', 'note']} loading={isLoading} />
      {open ? <ReceiptFormModal open onClose={() => setOpen(false)} /> : null}
    </>
  );
}
