import { useQuery } from '@tanstack/react-query';
import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { paymentsApi } from '../../api/payments.api';
import { salesApi } from '../../api/sales.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { formatNumber } from '../../lib/format';
import { paymentTypeLabel } from '../../lib/labels';
import type { Sale, SaleItem } from '../../types/sale';

function itemColumns(t: (key: string) => string): ColumnsType<SaleItem> {
  return [
    { title: t('clientDashboard.colProduct'), render: (_, row) => row.product.name },
    { title: t('clientDashboard.colCategory'), render: (_, row) => row.product.category ?? t('common.notSpecified') },
    { title: t('clientDashboard.colQtyPieces'), render: (_, row) => formatNumber(row.quantityPieces) },
    { title: t('clientDashboard.colQtyKg'), render: (_, row) => `${formatNumber(row.quantityKg)} ${t('units.KG')}` },
    { title: t('clientDashboard.colPricePerKg'), render: (_, row) => formatNumber(row.pricePerKg) },
    { title: t('clientDashboard.colSum2'), render: (_, row) => formatNumber(row.totalAmount) },
  ];
}

export function ClientDashboardPage() {
  const { t } = useTranslation();
  const { data: sales, isLoading } = useQuery({ queryKey: ['sales', 'my'], queryFn: salesApi.my });
  const { data: debtSummary } = useQuery({ queryKey: ['payments', 'my', 'summary'], queryFn: paymentsApi.mySummary });

  const totalOrders = sales?.length ?? 0;

  const columns: ColumnsType<Sale> = [
    { title: t('clientDashboard.colOrderNumber'), dataIndex: 'orderNumber', render: (value) => `№${value}`, sorter: (a, b) => a.orderNumber - b.orderNumber, defaultSortOrder: 'descend' },
    { title: t('clientDashboard.colDate'), dataIndex: 'soldAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    { title: t('clientDashboard.colItemsCount'), render: (_, row) => row.items.length },
    { title: t('clientDashboard.colSum'), render: (_, row) => formatNumber(row.totalAmount) },
    { title: t('clientDashboard.colType'), dataIndex: 'type', render: paymentTypeLabel },
    {
      title: t('clientDashboard.colPayment'),
      render: (_, row) => (row.paidAt ? <Tag color="green">{t('clientDashboard.paid')}</Tag> : <Tag color="orange">{t('clientDashboard.unpaid')}</Tag>),
    },
  ];

  return (
    <>
      <PageHeader title={t('clientDashboard.title')} description={t('clientDashboard.description')} />
      <Space wrap size={12} style={{ marginBottom: 20 }}>
        <StatCard title={t('clientDashboard.totalOrders')} value={totalOrders} />
        <StatCard title={t('clientDashboard.debt')} value={formatNumber(debtSummary?.qarz ?? 0)} />
        <StatCard title={t('clientDashboard.totalPaid')} value={formatNumber(debtSummary?.totalPaid ?? 0)} />
      </Space>
      <DataTable
        data={sales ?? []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        expandable={{
          expandedRowRender: (row) => <Table columns={itemColumns(t)} dataSource={row.items} rowKey="id" pagination={false} size="small" />,
        }}
      />
    </>
  );
}
