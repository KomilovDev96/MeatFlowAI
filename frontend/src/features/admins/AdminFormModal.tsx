import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, Divider, Drawer, Form, Input, Row, Select, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { companiesApi } from '../../api/companies.api';
import { superAdminApi } from '../../api/super-admin.api';
import { adminsApi } from '../../api/admins.api';
import { AvatarUpload } from '../../components/forms/AvatarUpload';
import { MapAddressPicker } from '../../components/forms/MapAddressPicker';
import i18n from '../../i18n';
import { getCurrencyOptions } from '../../lib/currency';
import type { Admin } from '../../types/admin';

const locationSchema = z.object({ address: z.string(), latitude: z.number(), longitude: z.number() });

const baseFields = {
  firstName: z.string().min(1, { error: () => i18n.t('validation.required') }),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  companyName: z.string().min(1, { error: () => i18n.t('validation.required') }),
  companyLogo: z.string().optional(),
  companyPhone: z.string().optional(),
  companyCurrency: z.string().min(1, { error: () => i18n.t('validation.required') }),
  companyMeasurementUnit: z.enum(['KG', 'PIECE']),
  location: locationSchema.optional(),
};

const createSchema = z.object({ ...baseFields, login: z.string().min(3, { error: () => i18n.t('validation.min3') }), password: z.string().min(8, { error: () => i18n.t('validation.min8') }) });
const editSchema = z.object({ ...baseFields, login: z.string().optional(), password: z.string().optional() });

type FormValues = z.infer<typeof editSchema>;

const emptyValues: FormValues = {
  firstName: '',
  lastName: '',
  avatar: '',
  login: '',
  password: '',
  phone: '',
  status: 'ACTIVE',
  companyName: '',
  companyLogo: '',
  companyPhone: '',
  companyCurrency: 'UZS',
  companyMeasurementUnit: 'KG',
  location: undefined,
};

function valuesFromAdmin(admin: Admin): FormValues {
  return {
    firstName: admin.firstName,
    lastName: admin.lastName ?? '',
    avatar: admin.avatar ?? '',
    login: admin.login,
    password: '',
    phone: admin.phone ?? '',
    status: admin.status,
    companyName: admin.company?.name ?? '',
    companyLogo: admin.company?.avatar ?? '',
    companyPhone: admin.company?.phone ?? '',
    companyCurrency: admin.company?.currency ?? 'UZS',
    companyMeasurementUnit: admin.company?.measurementUnit ?? 'KG',
    location:
      admin.company?.latitude != null && admin.company?.longitude != null
        ? { address: admin.company.address ?? '', latitude: admin.company.latitude, longitude: admin.company.longitude }
        : undefined,
  };
}

export function AdminFormModal({ open, onClose, admin }: { open: boolean; onClose: () => void; admin?: Admin | null }) {
  const { t } = useTranslation();
  const isEdit = Boolean(admin);
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const resolver = (isEdit ? zodResolver(editSchema) : zodResolver(createSchema)) as Resolver<FormValues>;
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(admin ? valuesFromAdmin(admin) : emptyValues);
  }, [open, admin, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (admin) {
        return Promise.all([
          adminsApi.update(admin.id, {
            firstName: values.firstName,
            lastName: values.lastName || undefined,
            avatar: values.avatar || undefined,
            phone: values.phone || undefined,
            status: values.status,
          }),
          admin.companyId
            ? companiesApi.update(admin.companyId, {
                name: values.companyName,
                avatar: values.companyLogo || undefined,
                phone: values.companyPhone || undefined,
                currency: values.companyCurrency,
                measurementUnit: values.companyMeasurementUnit,
                address: values.location?.address,
                latitude: values.location?.latitude,
                longitude: values.location?.longitude,
              })
            : Promise.resolve(null),
        ]);
      }
      return superAdminApi.createAdmin({
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        avatar: values.avatar || undefined,
        login: values.login!,
        password: values.password!,
        phone: values.phone || undefined,
        status: values.status,
        companyName: values.companyName,
        companyLogo: values.companyLogo || undefined,
        companyPhone: values.companyPhone || undefined,
        companyCurrency: values.companyCurrency,
        companyMeasurementUnit: values.companyMeasurementUnit,
        companyAddress: values.location?.address,
        companyLatitude: values.location?.latitude,
        companyLongitude: values.location?.longitude,
      });
    },
    onSuccess: () => {
      message.success(isEdit ? t('adminForm.changesSaved') : t('adminForm.createdSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (isEdit ? t('adminForm.saveFailed') : t('adminForm.createFailed'));
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={isEdit ? t('adminForm.editTitle') : t('adminForm.createTitle')}
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
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {t('adminForm.owner')}
        </Typography.Title>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label={t('adminForm.photo')}>
              <Controller name="avatar" control={control} render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} folder="avatars" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.firstName')} validateStatus={formState.errors.firstName ? 'error' : undefined} help={formState.errors.firstName?.message}>
              <Controller name="firstName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.lastName')}>
              <Controller name="lastName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.phone')}>
              <Controller name="phone" control={control} render={({ field }) => <Input {...field} placeholder="+998 90 123 45 67" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.status')}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: 'ACTIVE', label: t('status.ACTIVE') },
                      { value: 'INACTIVE', label: t('status.INACTIVE') },
                      { value: 'BLOCKED', label: t('status.BLOCKED') },
                    ]}
                  />
                )}
              />
            </Form.Item>
          </Col>
          {isEdit ? (
            <Col span={12}>
              <Form.Item label={t('adminForm.login')}>
                <Input value={admin?.login} disabled />
              </Form.Item>
            </Col>
          ) : (
            <>
              <Col span={12}>
                <Form.Item label={t('adminForm.login')} validateStatus={formState.errors.login ? 'error' : undefined} help={formState.errors.login?.message}>
                  <Controller name="login" control={control} render={({ field }) => <Input {...field} autoComplete="off" />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={t('adminForm.password')} validateStatus={formState.errors.password ? 'error' : undefined} help={formState.errors.password?.message}>
                  <Controller name="password" control={control} render={({ field }) => <Input.Password {...field} autoComplete="new-password" />} />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>

        <Divider />
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {t('adminForm.company')}
        </Typography.Title>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label={t('adminForm.companyLogo')}>
              <Controller name="companyLogo" control={control} render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} folder="logos" shape="square" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.companyName')} validateStatus={formState.errors.companyName ? 'error' : undefined} help={formState.errors.companyName?.message}>
              <Controller name="companyName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.companyPhone')}>
              <Controller name="companyPhone" control={control} render={({ field }) => <Input {...field} placeholder="+998 71 200 00 00" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('adminForm.currency')}
              validateStatus={formState.errors.companyCurrency ? 'error' : undefined}
              help={formState.errors.companyCurrency?.message}
            >
              <Controller name="companyCurrency" control={control} render={({ field }) => <Select {...field} options={getCurrencyOptions()} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('adminForm.measurementUnit')}>
              <Controller
                name="companyMeasurementUnit"
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
            <Form.Item label={t('adminForm.address')}>
              <Controller name="location" control={control} render={({ field }) => <MapAddressPicker value={field.value} onChange={field.onChange} />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
