import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productsApi } from '../../api/products.api';
import { receiptsApi } from '../../api/receipts.api';
import { formatNumber, formatThousands, parseThousands } from '../../lib/format';
import { unitLabel } from '../../lib/labels';

export function ReceiptFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.list, });

  const [productId, setProductId] = useState<string>();
  const [quantity, setQuantity] = useState<number | null>(null);
  const [unitCost, setUnitCost] = useState<number | null>(null);
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [receivedAt, setReceivedAt] = useState<Dayjs>(dayjs());

  const product = useMemo(() => products?.find((p) => p.id === productId), [products, productId]);
  const total = (quantity ?? 0) * (unitCost ?? 0);
  const valid = Boolean(productId) && (quantity ?? 0) > 0 && unitCost !== null && unitCost >= 0;

  const mutation = useMutation({
    mutationFn: () =>
      receiptsApi.create({
        productId: productId!,
        quantity: quantity!,
        unitCost: unitCost!,
        supplier: supplier || undefined,
        note: note || undefined,
        receivedAt: receivedAt.toISOString(),
      }),
    onSuccess: () => {
      message.success(t('stock.createdSuccess'));
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      onClose();
    },
    onError: (error: unknown) => {
      message.error((error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ?? t('stock.createFailed'));
    },
  });

  return (
    <Drawer
      title={t('stock.createTitle')}
      open={open}
      onClose={onClose}
      width={460}
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" disabled={!valid} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {t('common.create')}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item label={t('stock.product')} required>
          <Select
            showSearch
            optionFilterProp="label"
            value={productId}
            onChange={(id) => {
              setProductId(id);
              const p = products?.find((x) => x.id === id);
              if (p) setUnitCost(Number(p.purchasePrice));
            }}
            options={(products ?? []).map((p) => ({ value: p.id, label: `${p.name} (${unitLabel(p.unit)})` }))}
          />
        </Form.Item>
        {product ? (
          <Typography.Paragraph type="secondary">
            {t('stock.currentStock')}: {formatNumber(product.stock)} {unitLabel(product.unit)}
          </Typography.Paragraph>
        ) : null}
        <Form.Item label={t('stock.quantity')} required>
          <InputNumber value={quantity} onChange={setQuantity} min={0} style={{ width: '100%' }} addonAfter={product ? unitLabel(product.unit) : undefined} />
        </Form.Item>
        <Form.Item label={t('stock.unitCost')} required>
          <InputNumber value={unitCost} onChange={setUnitCost} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
        </Form.Item>
        <Typography.Paragraph strong>
          {t('stock.total')}: {formatNumber(total)}
        </Typography.Paragraph>
        <Form.Item label={t('stock.supplier')}>
          <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Form.Item>
        <Form.Item label={t('stock.date')}>
          <DatePicker showTime value={receivedAt} onChange={(d) => d && setReceivedAt(d)} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label={t('stock.note')}>
          <Input.TextArea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
