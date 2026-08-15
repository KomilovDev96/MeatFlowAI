import { useMutation, useQuery } from '@tanstack/react-query';
import { App, Avatar, Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CreditCard, Pencil, Plus, Send, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clientsApi } from '../../api/clients.api';
import { paymentsApi } from '../../api/payments.api';
import { salesApi } from '../../api/sales.api';
import { telegramApi } from '../../api/telegram.api';
import { DataTable } from '../../components/tables/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { displayName, formatNumber } from '../../lib/format';
import { paymentMethodLabel, paymentTypeLabel, statusLabel } from '../../lib/labels';
import type { Client } from '../../types/client';
import type { Payment } from '../../types/payment';
import type { Sale, SaleItem } from '../../types/sale';
import { OrderFormModal } from './OrderFormModal';
import { PaymentFormModal } from './PaymentFormModal';

const STATUS_COLOR: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', BLOCKED: 'red' };

export function ClientDetailDrawer({ open, onClose, client }: { open: boolean; onClose: () => void; client: Client | null }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [telegramCode, setTelegramCode] = useState<{ code: string; expiresAt: string } | null>(null);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales', client?.id],
    queryFn: async () => (await salesApi.list()).filter((sale) => sale.clientId === client!.id),
    enabled: open && Boolean(client),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', client?.id],
    queryFn: async () => (await paymentsApi.list()).filter((payment) => payment.clientId === client!.id),
    enabled: open && Boolean(client),
  });

  const { data: debtSummary } = useQuery({
    queryKey: ['payments', 'summary', client?.id],
    queryFn: () => paymentsApi.summary(client!.id),
    enabled: open && Boolean(client),
  });

  const { data: botStatus } = useQuery({ queryKey: ['telegram', 'status'], queryFn: telegramApi.status, enabled: open });

  const generateCode = useMutation({
    mutationFn: () => clientsApi.getTelegramCode(client!.id),
    onSuccess: (data) => setTelegramCode(data),
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('clientDetail.getCodeFailed');
      message.error(description);
    },
  });

  const openCreateOrder = () => {
    setEditingSale(null);
    setOrderModalOpen(true);
  };

  const openEditOrder = (sale: Sale) => {
    setEditingSale(sale);
    setOrderModalOpen(true);
  };

  const paymentColumns: ColumnsType<Payment> = [
    { title: t('clientDetail.colDate'), dataIndex: 'paidAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    { title: t('clientDetail.colAmount'), dataIndex: 'amount', render: (value) => formatNumber(value) },
    { title: t('clientDetail.colPaymentType'), dataIndex: 'method', render: paymentMethodLabel },
    { title: t('clientDetail.colCurrency'), dataIndex: 'currency' },
    { title: t('clientDetail.colComment'), dataIndex: 'note', render: (value) => value ?? t('common.notSpecified') },
  ];

  const columns: ColumnsType<Sale> = [
    { title: t('clientDetail.colOrderNumber'), dataIndex: 'orderNumber', render: (value) => `№${value}`, sorter: (a, b) => a.orderNumber - b.orderNumber, defaultSortOrder: 'descend' },
    { title: t('clientDetail.colDate'), dataIndex: 'soldAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
    { title: t('clientDetail.colItemsCount'), render: (_, row) => row.items.length },
    { title: t('clientDetail.colSum'), render: (_, row) => formatNumber(row.totalAmount) },
    { title: t('clientDetail.colType'), dataIndex: 'type', render: paymentTypeLabel },
    {
      title: t('clientDetail.colPayment'),
      render: (_, row) => (row.paidAt ? <Tag color="green">{t('clientDetail.paid')}</Tag> : <Tag color="orange">{t('clientDetail.unpaid')}</Tag>),
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
            openEditOrder(row);
          }}
        />
      ),
    },
  ];

  return (
    <Drawer title={t('clientDetail.title')} open={open} onClose={onClose} width={900} destroyOnHidden>
      {client && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Space align="center" size={16}>
            <Avatar size={64} src={client.avatar ?? undefined} icon={<UserRound size={28} />} />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {displayName(client)}
              </Typography.Title>
              <Tag color={STATUS_COLOR[client.status]}>{statusLabel(client.status)}</Tag>
            </div>
          </Space>

          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label={t('clientDetail.phone')}>{client.phone ?? t('common.notSpecified')}</Descriptions.Item>
            <Descriptions.Item label={t('clientDetail.phone2')}>{client.phone2 ?? t('common.notSpecified')}</Descriptions.Item>
            <Descriptions.Item label={t('clientDetail.appAccess')} span={2}>
              {client.login ? <Tag color="blue">{client.login}</Tag> : t('clientDetail.notIssued')}
            </Descriptions.Item>
            {client.notes && (
              <Descriptions.Item label={t('clientDetail.notes')} span={2}>
                {client.notes}
              </Descriptions.Item>
            )}
          </Descriptions>

          <div>
            <Typography.Title level={5} style={{ marginBottom: 12 }}>
              {t('clientDetail.telegramBot')}
            </Typography.Title>
            {client.telegramId ? (
              <Tag color="green">{t('clientDetail.connected')}{client.telegramUsername ? ` — @${client.telegramUsername}` : ''}</Tag>
            ) : (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space align="center">
                  <Tag>{t('clientDetail.notConnected')}</Tag>
                  <Button size="small" icon={<Send size={14} />} loading={generateCode.isPending} onClick={() => generateCode.mutate()}>
                    {t('clientDetail.getCodeButton')}
                  </Button>
                </Space>
                {telegramCode && (
                  <Space direction="vertical" size={4} style={{ padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                    <Typography.Text type="secondary">{t('clientDetail.codeForClient', { time: dayjs(telegramCode.expiresAt).format('HH:mm') })}</Typography.Text>
                    <Typography.Title level={3} style={{ margin: 0, letterSpacing: 4 }}>
                      {telegramCode.code}
                    </Typography.Title>
                    {botStatus?.botUsername && (
                      <a href={`https://t.me/${botStatus.botUsername}?start=${telegramCode.code}`} target="_blank" rel="noreferrer">
                        {t('clientDetail.openInTelegram', { username: botStatus.botUsername })}
                      </a>
                    )}
                  </Space>
                )}
              </Space>
            )}
          </div>

          <div>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {t('clientDetail.debtAndPayments')}
              </Typography.Title>
              <Button type="primary" size="small" icon={<CreditCard size={14} />} onClick={() => setPaymentModalOpen(true)}>
                {t('clientDetail.recordPaymentButton')}
              </Button>
            </Space>
            <Space wrap size={12} style={{ marginBottom: 12 }}>
              <StatCard title={t('clientDetail.debt')} value={formatNumber(debtSummary?.qarz ?? 0)} />
              <StatCard title={t('clientDetail.balance')} value={formatNumber(debtSummary?.balans ?? 0)} />
              <StatCard title={t('clientDetail.totalPaid')} value={formatNumber(debtSummary?.totalPaid ?? 0)} />
            </Space>
            <DataTable data={payments ?? []} columns={paymentColumns} rowKey="id" loading={paymentsLoading} />
          </div>

          <div>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {t('clientDetail.orders')}
              </Typography.Title>
              <Button type="primary" size="small" icon={<Plus size={14} />} onClick={openCreateOrder}>
                {t('clientDetail.createOrderButton')}
              </Button>
            </Space>
            <DataTable
              data={sales ?? []}
              columns={columns}
              rowKey="id"
              loading={isLoading}
              onRowClick={openEditOrder}
              expandable={{
                expandedRowRender: (row) => <Table columns={itemColumns(t)} dataSource={row.items} rowKey="id" pagination={false} size="small" />,
              }}
            />
          </div>
        </Space>
      )}
      {client && <OrderFormModal open={orderModalOpen} onClose={() => setOrderModalOpen(false)} client={client} sale={editingSale} />}
      {client && <PaymentFormModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} client={client} />}
    </Drawer>
  );
}

function itemColumns(t: (key: string) => string): ColumnsType<SaleItem> {
  return [
    { title: t('clientDetail.colProduct'), render: (_, row) => row.product.name },
    { title: t('clientDetail.colCategory'), render: (_, row) => row.product.category ?? t('common.notSpecified') },
    { title: t('clientDetail.colQtyPieces'), render: (_, row) => formatNumber(row.quantityPieces) },
    { title: t('clientDetail.colQtyKg'), render: (_, row) => `${formatNumber(row.quantityKg)} ${t('units.KG')}` },
    { title: t('clientDetail.colPricePerKg'), render: (_, row) => formatNumber(row.pricePerKg) },
    { title: t('clientDetail.colSum'), render: (_, row) => formatNumber(row.totalAmount) },
  ];
}
