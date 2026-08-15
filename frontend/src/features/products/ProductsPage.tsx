import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Avatar, Button, Popconfirm, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Package, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi } from '../../api/products.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatNumber } from '../../lib/format';
import { statusLabel, unitLabel } from '../../lib/labels';
import type { Product } from '../../types/product';
import { ProductFormModal } from './ProductFormModal';

export function ProductsPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });

  const removeMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      message.success(t('products.deletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('products.deleteFailed');
      message.error(description);
    },
  });

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const columns: ColumnsType<Product> = [
    {
      title: t('products.colName'),
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, row) => (
        <Space>
          <Avatar shape="square" src={row.image ?? undefined} icon={<Package size={16} />} />
          {row.name}
        </Space>
      ),
    },
    { title: t('products.colCategory'), dataIndex: 'category', render: (value) => value ?? t('common.notSpecified') },
    { title: t('products.colUnit'), dataIndex: 'unit', render: unitLabel },
    { title: t('products.colStock'), dataIndex: 'stock', sorter: (a, b) => Number(a.stock) - Number(b.stock), render: (value) => formatNumber(value) },
    { title: t('products.colSalePrice'), dataIndex: 'salePrice', render: (value) => formatNumber(value) },
    { title: t('products.colStatus'), dataIndex: 'status', render: statusLabel },
    {
      title: t('products.colActions'),
      key: 'actions',
      render: (_, row) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button size="small" icon={<Pencil size={14} />} onClick={() => openEdit(row)}>
            {t('common.edit')}
          </Button>
          <Popconfirm title={t('products.deleteConfirmTitle')} okText={t('common.delete')} cancelText={t('common.cancel')} onConfirm={() => removeMutation.mutate(row.id)}>
            <Button size="small" danger icon={<Trash2 size={14} />} loading={removeMutation.isPending && removeMutation.variables === row.id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('products.title')}
        description={t('products.description')}
        actions={
          <Button type="primary" icon={<PackagePlus size={16} />} onClick={openCreate}>
            {t('products.addButton')}
          </Button>
        }
      />
      <DataTable data={data ?? []} columns={columns} rowKey="id" searchKeys={['name', 'category', 'status']} loading={isLoading} onRowClick={openEdit} />
      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} product={editingProduct} />
    </>
  );
}
