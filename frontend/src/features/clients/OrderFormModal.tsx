import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, DatePicker, Drawer, Form, Input, InputNumber, Radio, Row, Select, Space, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { clientsApi } from '../../api/clients.api';
import { paymentsApi } from '../../api/payments.api';
import { productsApi } from '../../api/products.api';
import { salesApi } from '../../api/sales.api';
import i18n from '../../i18n';
import { displayName, formatNumber, formatThousands, parseThousands } from '../../lib/format';
import type { Client } from '../../types/client';
import type { Sale } from '../../types/sale';

const itemSchema = z.object({
  productId: z.string().min(1, { error: () => i18n.t('validation.selectProduct') }),
  quantityPieces: z.number().min(0),
  quantityKg: z.number().min(0.001, { error: () => i18n.t('validation.specifyKg') }),
  pricePerKg: z.number().min(0),
});

const schema = z.object({
  clientId: z.string().min(1, { error: () => i18n.t('validation.selectClient') }),
  type: z.enum(['CASH', 'CONSIGNMENT']),
  soldAt: z.string().min(1),
  note: z.string().optional(),
  isPaid: z.boolean(),
  paidNow: z.number().min(0),
  items: z.array(itemSchema).min(1, { error: () => i18n.t('validation.addOneProduct') }),
});

type FormValues = z.infer<typeof schema>;

const emptyItem = { productId: '', quantityPieces: 0, quantityKg: 0, pricePerKg: 0 };

const emptyValues: FormValues = {
  clientId: '',
  type: 'CASH',
  soldAt: dayjs().format('YYYY-MM-DD'),
  note: '',
  isPaid: false,
  paidNow: 0,
  items: [emptyItem],
};

function valuesFromSale(sale: Sale): FormValues {
  return {
    clientId: sale.clientId,
    type: sale.type,
    soldAt: dayjs(sale.soldAt).format('YYYY-MM-DD'),
    note: sale.note ?? '',
    isPaid: sale.paidAt != null,
    paidNow: 0,
    items: sale.items.map((item) => ({
      productId: item.productId,
      quantityPieces: Number(item.quantityPieces),
      quantityKg: Number(item.quantityKg),
      pricePerKg: Number(item.pricePerKg),
    })),
  };
}

export function OrderFormModal({ open, onClose, client, sale }: { open: boolean; onClose: () => void; client?: Client | null; sale?: Sale | null }) {
  const { t } = useTranslation();
  const isEdit = Boolean(sale);
  const fixedClient = client ?? sale?.client ?? null;
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: productsApi.list, enabled: open });
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: clientsApi.list, enabled: open && !fixedClient });
  const { control, handleSubmit, reset, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (!open) return;
    if (sale) reset(valuesFromSale(sale));
    else reset({ ...emptyValues, clientId: client?.id ?? '' });
  }, [open, sale, client, reset]);

  const type = watch('type');
  const items = watch('items');
  const grandTotal = items.reduce((sum, item) => sum + item.quantityKg * item.pricePerKg, 0);

  const handleProductChange = (index: number, productId: string, onChange: (value: string) => void) => {
    onChange(productId);
    const product = products?.find((p) => p.id === productId);
    if (product) setValue(`items.${index}.pricePerKg`, Number(product.salePrice));
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payloadItems = values.items.map((item) => ({
        productId: item.productId,
        quantityPieces: item.quantityPieces,
        quantityKg: item.quantityKg,
        pricePerKg: item.pricePerKg,
      }));
      if (sale) {
        return salesApi.update(sale.id, {
          items: payloadItems,
          type: values.type,
          soldAt: values.soldAt,
          note: values.note || undefined,
          isPaid: values.isPaid,
        });
      }
      const created = await salesApi.create({ clientId: values.clientId, items: payloadItems, type: values.type, soldAt: values.soldAt, note: values.note || undefined });
      if (values.type === 'CONSIGNMENT' && values.paidNow > 0) {
        await paymentsApi.create({
          clientId: values.clientId,
          amount: values.paidNow,
          method: 'CASH',
          paidAt: values.soldAt,
          note: t('orderForm.paymentNoteForOrder', { number: created.orderNumber }),
        });
      }
      return created;
    },
    onSuccess: () => {
      message.success(isEdit ? t('orderForm.updatedSuccess') : t('orderForm.createdSuccess'));
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('orderForm.saveFailed');
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={isEdit ? t('orderForm.orderNumberTitle', { number: sale!.orderNumber }) : fixedClient ? t('orderForm.newOrderTitleFor', { name: displayName(fixedClient) }) : t('orderForm.newOrderTitle')}
      open={open}
      onClose={onClose}
      placement="right"
      width="50%"
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={submit}>
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        {!fixedClient && (
          <Form.Item label={t('orderForm.client')} validateStatus={formState.errors.clientId ? 'error' : undefined} help={formState.errors.clientId?.message}>
            <Controller
              name="clientId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  placeholder={t('orderForm.selectClientPlaceholder')}
                  showSearch
                  optionFilterProp="label"
                  options={clients?.map((c) => ({ value: c.id, label: displayName(c) }))}
                  onChange={field.onChange}
                />
              )}
            />
          </Form.Item>
        )}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('orderForm.date')}>
              <Controller
                name="soldAt"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    style={{ width: '100%' }}
                    value={field.value ? dayjs(field.value) : undefined}
                    onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
                    format="DD.MM.YYYY"
                  />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('orderForm.paymentType')}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(e) => field.onChange(e.target.value)} optionType="button" buttonStyle="solid">
                    <Radio.Button value="CASH">{t('orderForm.cash')}</Radio.Button>
                    <Radio.Button value="CONSIGNMENT">{t('orderForm.debt')}</Radio.Button>
                  </Radio.Group>
                )}
              />
            </Form.Item>
          </Col>
          {isEdit && type === 'CONSIGNMENT' && (
            <Col span={8}>
              <Form.Item label={t('orderForm.paid')} valuePropName="checked">
                <Controller name="isPaid" control={control} render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />} />
              </Form.Item>
            </Col>
          )}
          {!isEdit && type === 'CONSIGNMENT' && (
            <Col span={8}>
              <Form.Item label={t('orderForm.paidNow')}>
                <Controller
                  name="paidNow"
                  control={control}
                  render={({ field }) => (
                    <InputNumber {...field} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
                  )}
                />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Typography.Title level={5} style={{ marginTop: 8 }}>
          {t('orderForm.products')}
        </Typography.Title>
        <Row gutter={8} style={{ marginBottom: 4, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
          <Col span={8}>{t('orderForm.colProduct')}</Col>
          <Col span={3}>{t('orderForm.colQtyPieces')}</Col>
          <Col span={3}>{t('orderForm.colQtyKg')}</Col>
          <Col span={4}>{t('orderForm.colPricePerKg')}</Col>
          <Col span={4}>{t('orderForm.colSum')}</Col>
          <Col span={2} />
        </Row>
        {fields.map((field, index) => (
          <Row gutter={8} key={field.id} align="middle" style={{ marginBottom: 8 }}>
            <Col span={8}>
              <Controller
                name={`items.${index}.productId`}
                control={control}
                render={({ field: f }) => (
                  <Select
                    value={f.value || undefined}
                    placeholder={t('orderForm.productPlaceholder')}
                    style={{ width: '100%' }}
                    options={products?.map((p) => ({ value: p.id, label: `${p.name}${p.category ? ` (${p.category})` : ''}` }))}
                    onChange={(value) => handleProductChange(index, value, f.onChange)}
                    status={formState.errors.items?.[index]?.productId ? 'error' : undefined}
                  />
                )}
              />
            </Col>
            <Col span={3}>
              <Controller
                name={`items.${index}.quantityPieces`}
                control={control}
                render={({ field: f }) => <InputNumber {...f} min={0} style={{ width: '100%' }} />}
              />
            </Col>
            <Col span={3}>
              <Controller
                name={`items.${index}.quantityKg`}
                control={control}
                render={({ field: f }) => <InputNumber {...f} min={0} step={0.1} style={{ width: '100%' }} />}
              />
            </Col>
            <Col span={4}>
              <Controller
                name={`items.${index}.pricePerKg`}
                control={control}
                render={({ field: f }) => (
                  <InputNumber {...f} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
                )}
              />
            </Col>
            <Col span={4}>
              <Typography.Text>{formatNumber(items[index].quantityKg * items[index].pricePerKg)}</Typography.Text>
            </Col>
            <Col span={2}>
              <Button danger icon={<Trash2 size={14} />} disabled={fields.length <= 1} onClick={() => remove(index)} />
            </Col>
          </Row>
        ))}
        {formState.errors.items?.message && <Typography.Text type="danger">{formState.errors.items.message}</Typography.Text>}

        <Button type="dashed" icon={<Plus size={14} />} onClick={() => append(emptyItem)} block style={{ marginTop: 4 }}>
          {t('orderForm.addProductButton')}
        </Button>

        <Row justify="end" style={{ marginTop: 16 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('orderForm.total', { amount: formatNumber(grandTotal) })}
          </Typography.Title>
        </Row>

        <Form.Item label={t('orderForm.note')} style={{ marginTop: 16 }}>
          <Controller name="note" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
