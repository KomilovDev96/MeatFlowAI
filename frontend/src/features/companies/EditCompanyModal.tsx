import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, Drawer, Form, Input, Row, Select, Space } from 'antd';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { companiesApi } from '../../api/companies.api';
import { AvatarUpload } from '../../components/forms/AvatarUpload';
import { MapAddressPicker } from '../../components/forms/MapAddressPicker';
import i18n from '../../i18n';
import { getCurrencyOptions } from '../../lib/currency';
import type { Company } from '../../types/company';

const schema = z.object({
  name: z.string().min(1, { error: () => i18n.t('validation.required') }),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().min(1, { error: () => i18n.t('validation.required') }),
  measurementUnit: z.enum(['KG', 'PIECE']),
  location: z.object({ address: z.string(), latitude: z.number(), longitude: z.number() }).optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: '', avatar: '', phone: '', description: '', currency: 'UZS', measurementUnit: 'KG', location: undefined };

function valuesFromCompany(company: Company): FormValues {
  return {
    name: company.name,
    avatar: company.avatar ?? '',
    phone: company.phone ?? '',
    description: company.description ?? '',
    currency: company.currency,
    measurementUnit: company.measurementUnit,
    location:
      company.latitude != null && company.longitude != null
        ? { address: company.address ?? '', latitude: company.latitude, longitude: company.longitude }
        : undefined,
  };
}

export function EditCompanyModal({ open, onClose, company }: { open: boolean; onClose: () => void; company: Company | null }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open || !company) return;
    reset(valuesFromCompany(company));
  }, [open, company, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      companiesApi.update(company!.id, {
        name: values.name,
        avatar: values.avatar || undefined,
        phone: values.phone || undefined,
        description: values.description || undefined,
        currency: values.currency,
        measurementUnit: values.measurementUnit,
        address: values.location?.address,
        latitude: values.location?.latitude,
        longitude: values.location?.longitude,
      }),
    onSuccess: () => {
      message.success(t('companies.changesSaved'));
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('companies.saveFailed');
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={t('companies.editTitle')}
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
      {company && (
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label={t('companies.logo')}>
                <Controller name="avatar" control={control} render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} folder="logos" shape="square" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('companies.name')} validateStatus={formState.errors.name ? 'error' : undefined} help={formState.errors.name?.message}>
                <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('companies.colPhone')}>
                <Controller name="phone" control={control} render={({ field }) => <Input {...field} placeholder="+998 71 200 00 00" />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('companies.colCurrency')} validateStatus={formState.errors.currency ? 'error' : undefined} help={formState.errors.currency?.message}>
                <Controller name="currency" control={control} render={({ field }) => <Select {...field} options={getCurrencyOptions()} />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={t('companies.measurementUnit')}>
                <Controller
                  name="measurementUnit"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: 'KG', label: t('unitOptions.KG') },
                        { value: 'PIECE', label: t('unitOptions.PIECE') },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label={t('companies.description2')}>
                <Controller name="description" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label={t('companies.address')}>
                <Controller name="location" control={control} render={({ field }) => <MapAddressPicker value={field.value} onChange={field.onChange} />} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </Drawer>
  );
}
