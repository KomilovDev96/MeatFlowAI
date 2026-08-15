import { useQuery } from '@tanstack/react-query';
import { Button, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { salesApi } from '../../api/sales.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { displayName, formatNumber } from '../../lib/format';
import { paymentTypeLabel } from '../../lib/labels';
import type { Sale, SaleItem } from '../../types/sale';
import { OrderFormModal } from '../clients/OrderFormModal';

function itemColumns(t: (key: string) => string): ColumnsType<SaleItem> {
  return [
    { title: t('ordersPage.colProduct'), render: (_, row) => row.product.name },
    { title: t('ordersPage.colCategory'), render: (_, row) => row.product.category ?? t('common.notSpecified') },
    { title: t('ordersPage.colQtyPieces'), render: (_, row) => formatNumber(row.quantityPieces) },
    { title: t('ordersPage.colQtyKg'), render: (_, row) => `${formatNumber(row.quantityKg)} ${t('units.KG')}` },
    { title: t('ordersPage.colPricePerKg'), render: (_, row) => formatNumber(row.pricePerKg) },
    { title: t('ordersPage.colSum'), render: (_, row) => formatNumber(row.totalAmount) },
  ];
}

type OrderRow = Sale & { clientName: string };

export function OrdersPage() {
  const { t } = useTranslation();
  const { data: sales, isLoading } = useQuery({ queryKey: ['sales'], queryFn: salesApi.list });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const openCreate = () => {
    setEditingSale(null);
    setModalOpen(true);
  };

  const openEdit = (sale: Sale) => {
    setEditingSale(sale);
    setModalOpen(true);
  };

  const rows: OrderRow[] = (sales ?? []).map((sale) => ({ ...sale, clientName: displayName(sale.client) }));

  const columns: ColumnsType<OrderRow> = [
    { title: t('ordersPage.colOrderNumber'), dataIndex: 'orderNumber', render: (value) => `№${value}`, sorter: (a, b) => a.orderNumber - b.orderNumber, defaultSortOrder: 'descend' },
    { title: t('ordersPage.colDate'), dataIndex: 'soldAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    { title: t('ordersPage.colClient'), dataIndex: 'clientName' },
    { title: t('ordersPage.colItemsCount'), render: (_, row) => row.items.length },
    { title: t('ordersPage.colSum'), render: (_, row) => formatNumber(row.totalAmount) },
    { title: t('ordersPage.colType'), dataIndex: 'type', render: paymentTypeLabel },
    {
      title: t('ordersPage.colPayment'),
      render: (_, row) => (row.paidAt ? <Tag color="green">{t('ordersPage.paid')}</Tag> : <Tag color="orange">{t('ordersPage.unpaid')}</Tag>),
    },
    {
      title: '',
      key: 'actions',
      render: (_, row) => (
        <Button
          size="small"
          icon={<Pencil size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            openEdit(row);
          }}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('ordersPage.title')}
        description={t('ordersPage.description')}
        actions={
          <Button type="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {t('ordersPage.createButton')}
          </Button>
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        rowKey="id"
        searchKeys={['clientName']}
        loading={isLoading}
        onRowClick={openEdit}
        expandable={{
          expandedRowRender: (row) => <Table columns={itemColumns(t)} dataSource={row.items} rowKey="id" pagination={false} size="small" />,
        }}
      />
      <OrderFormModal open={modalOpen} onClose={() => setModalOpen(false)} sale={editingSale} />
    </>
  );
}
