import { useQuery } from '@tanstack/react-query';
import { Card, Col, DatePicker, Row, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/reports.api';
import { DataTable } from '../../components/tables/DataTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { formatNumber } from '../../lib/format';
import { unitLabel } from '../../lib/labels';
import type { ReportItem } from '../../types/receipt';

export function ReportsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const params = { from: range?.[0].startOf('day').toISOString(), to: range?.[1].endOf('day').toISOString() };
  const { data, isLoading } = useQuery({ queryKey: ['report', params.from, params.to], queryFn: () => reportsApi.summary(params) });

  const qty = (v: string, row: ReportItem) => `${formatNumber(v)} ${unitLabel(row.unit)}`;
  const profitColor = (v: string) => (Number(v) < 0 ? '#cf1322' : Number(v) > 0 ? '#389e0d' : undefined);

  const columns: ColumnsType<ReportItem> = [
    { title: t('reports.product'), dataIndex: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: t('reports.stock'), dataIndex: 'stock', sorter: (a, b) => Number(a.stock) - Number(b.stock), render: qty },
    { title: t('reports.stockValue'), dataIndex: 'stockValue', render: (v) => formatNumber(v) },
    { title: t('reports.received'), dataIndex: 'received', render: qty },
    { title: t('reports.sold'), dataIndex: 'sold', render: qty },
    { title: t('reports.revenue'), dataIndex: 'revenue', sorter: (a, b) => Number(a.revenue) - Number(b.revenue), render: (v) => formatNumber(v) },
    { title: t('reports.cost'), dataIndex: 'cost', render: (v) => formatNumber(v) },
    {
      title: t('reports.profit'),
      dataIndex: 'profit',
      sorter: (a, b) => Number(a.profit) - Number(b.profit),
      render: (v) => <Typography.Text style={{ color: profitColor(v) }} strong>{formatNumber(v)}</Typography.Text>,
    },
  ];

  const totals = data?.totals;
  const money = (v?: string) => (v === undefined ? '…' : formatNumber(v));

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        actions={<DatePicker.RangePicker value={range} onChange={(v) => setRange(v as [Dayjs, Dayjs] | null)} allowClear />}
      />
      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.revenue')} value={money(totals?.revenue)} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.cost')} value={money(totals?.cost)} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <Card>
              <Typography.Text type="secondary">{t('reports.profit')}</Typography.Text>
              <div style={{ fontSize: 24, fontWeight: 600, color: profitColor(totals?.profit ?? '0') }}>{money(totals?.profit)}</div>
              <Typography.Text type="secondary">
                {t('reports.margin')}: {totals ? `${totals.marginPercent}%` : '…'}
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.stockValue')} value={money(totals?.stockValue)} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.receivedCost')} value={money(totals?.receivedCost)} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.unpaid')} value={money(totals?.unpaidSales)} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.salesCount')} value={totals?.salesCount ?? '…'} />
          </Col>
          <Col xs={24} md={12} xl={6}>
            <StatCard title={t('reports.receiptsCount')} value={totals?.receiptsCount ?? '…'} />
          </Col>
        </Row>
        <DataTable data={data?.items ?? []} columns={columns} rowKey="productId" searchKeys={['name']} loading={isLoading} />
        <Typography.Text type="secondary">{t('reports.hint')}</Typography.Text>
      </Space>
    </>
  );
}
