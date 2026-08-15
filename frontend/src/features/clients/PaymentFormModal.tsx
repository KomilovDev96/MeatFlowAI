import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, DatePicker, Drawer, Form, Input, InputNumber, Radio, Row, Space } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { paymentsApi } from '../../api/payments.api';
import i18n from '../../i18n';
import { displayName, formatThousands, parseThousands } from '../../lib/format';
import type { Client } from '../../types/client';

const schema = z.object({
  amount: z.number().min(0.01, { error: () => i18n.t('validation.required') }),
  method: z.enum(['CASH', 'TRANSFER']),
  currency: z.string().min(1, { error: () => i18n.t('validation.required') }),
  paidAt: z.string().min(1),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  amount: 0,
  method: 'CASH',
  currency: 'UZS',
  paidAt: dayjs().format('YYYY-MM-DD'),
  note: '',
};

export function PaymentFormModal({ open, onClose, client }: { open: boolean; onClose: () => void; client: Client }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(emptyValues);
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      paymentsApi.create({
        clientId: client.id,
        amount: values.amount,
        method: values.method,
        currency: values.currency,
        paidAt: values.paidAt,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      message.success(t('paymentForm.recordedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('paymentForm.saveFailed');
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={t('paymentForm.title', { name: displayName(client) })}
      open={open}
      onClose={onClose}
      placement="right"
      width="50%"
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" loading={mutation.isPending} onClick={submit}>
            {t('common.save')}
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('paymentForm.amount')} validateStatus={formState.errors.amount ? 'error' : undefined} help={formState.errors.amount?.message}>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('paymentForm.currency')} validateStatus={formState.errors.currency ? 'error' : undefined} help={formState.errors.currency?.message}>
              <Controller name="currency" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('paymentForm.date')}>
              <Controller
                name="paidAt"
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
          <Col span={12}>
            <Form.Item label={t('paymentForm.method')}>
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Radio.Group value={field.value} onChange={(e) => field.onChange(e.target.value)} optionType="button" buttonStyle="solid">
                    <Radio.Button value="CASH">{t('paymentMethod.CASH')}</Radio.Button>
                    <Radio.Button value="TRANSFER">{t('paymentMethod.TRANSFER')}</Radio.Button>
                  </Radio.Group>
                )}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('paymentForm.note')}>
              <Controller name="note" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
