import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, Divider, Drawer, Form, Input, Row, Select, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { clientsApi } from '../../api/clients.api';
import { AvatarUpload } from '../../components/forms/AvatarUpload';
import i18n from '../../i18n';
import type { Client } from '../../types/client';

const schema = z.object({
  avatar: z.string().optional(),
  firstName: z.string().min(1, { error: () => i18n.t('validation.required') }),
  lastName: z.string().optional(),
  phone: z.string().min(1, { error: () => i18n.t('validation.required') }),
  phone2: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  notes: z.string().optional(),
  login: z.string().optional(),
  password: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  avatar: '',
  firstName: '',
  lastName: '',
  phone: '',
  phone2: '',
  status: 'ACTIVE',
  notes: '',
  login: '',
  password: '',
};

function valuesFromClient(client: Client): FormValues {
  return {
    avatar: client.avatar ?? '',
    firstName: client.firstName,
    lastName: client.lastName ?? '',
    phone: client.phone ?? '',
    phone2: client.phone2 ?? '',
    status: client.status,
    notes: client.notes ?? '',
    login: client.login ?? '',
    password: '',
  };
}

export function ClientFormModal({ open, onClose, client }: { open: boolean; onClose: () => void; client?: Client | null }) {
  const { t } = useTranslation();
  const isEdit = Boolean(client);
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(client ? valuesFromClient(client) : emptyValues);
  }, [open, client, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName || undefined,
        avatar: values.avatar || undefined,
        phone: values.phone,
        phone2: values.phone2 || undefined,
        status: values.status,
        notes: values.notes || undefined,
        login: values.login || undefined,
        password: values.password || undefined,
      };
      return client ? clientsApi.update(client.id, payload) : clientsApi.create({ ...payload, phone: values.phone });
    },
    onSuccess: () => {
      message.success(isEdit ? t('clientForm.changesSaved') : t('clientForm.createdSuccess'));
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (isEdit ? t('clientForm.saveFailed') : t('clientForm.createFailed'));
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={isEdit ? t('clientForm.editTitle') : t('clientForm.createTitle')}
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
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label={t('clientForm.photo')}>
              <Controller name="avatar" control={control} render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} folder="avatars" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.firstName')} validateStatus={formState.errors.firstName ? 'error' : undefined} help={formState.errors.firstName?.message}>
              <Controller name="firstName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.lastName')}>
              <Controller name="lastName" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.phone')} validateStatus={formState.errors.phone ? 'error' : undefined} help={formState.errors.phone?.message}>
              <Controller name="phone" control={control} render={({ field }) => <Input {...field} placeholder="+998 90 123 45 67" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.phone2')}>
              <Controller name="phone2" control={control} render={({ field }) => <Input {...field} placeholder="+998 90 123 45 67" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.status')}>
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
          <Col span={24}>
            <Form.Item label={t('clientForm.notes')}>
              <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          {t('clientForm.appAccess')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
          {t('clientForm.appAccessHint')}
        </Typography.Paragraph>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('clientForm.login')}>
              <Controller name="login" control={control} render={({ field }) => <Input {...field} autoComplete="off" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('clientForm.password')} help={isEdit ? t('clientForm.passwordHintEdit') : t('clientForm.passwordHintCreate')}>
              <Controller name="password" control={control} render={({ field }) => <Input.Password {...field} autoComplete="new-password" />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
