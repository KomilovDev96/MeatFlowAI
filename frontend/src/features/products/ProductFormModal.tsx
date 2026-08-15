import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Col, Drawer, Form, Input, InputNumber, Row, Select, Space } from 'antd';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { productsApi } from '../../api/products.api';
import { AvatarUpload } from '../../components/forms/AvatarUpload';
import i18n from '../../i18n';
import { formatThousands, parseThousands } from '../../lib/format';
import type { Product } from '../../types/product';

const schema = z.object({
  name: z.string().min(1, { error: () => i18n.t('validation.required') }),
  image: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  unit: z.enum(['KG', 'PIECE']),
  purchasePrice: z.number().min(0),
  salePrice: z.number().min(0),
  stock: z.number().min(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  name: '',
  image: '',
  category: '',
  description: '',
  unit: 'KG',
  purchasePrice: 0,
  salePrice: 0,
  stock: 0,
  status: 'ACTIVE',
};

function valuesFromProduct(product: Product): FormValues {
  return {
    name: product.name,
    image: product.image ?? '',
    category: product.category ?? '',
    description: product.description ?? '',
    unit: product.unit,
    purchasePrice: Number(product.purchasePrice),
    salePrice: Number(product.salePrice),
    stock: Number(product.stock),
    status: product.status,
  };
}

export function ProductFormModal({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product | null }) {
  const { t } = useTranslation();
  const isEdit = Boolean(product);
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(product ? valuesFromProduct(product) : emptyValues);
  }, [open, product, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => (product ? productsApi.update(product.id, values) : productsApi.create(values)),
    onSuccess: () => {
      message.success(isEdit ? t('productForm.changesSaved') : t('productForm.createdSuccess'));
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: (error: unknown) => {
      const description =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (isEdit ? t('productForm.saveFailed') : t('productForm.createFailed'));
      message.error(description);
    },
  });

  const submit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Drawer
      title={isEdit ? t('productForm.editTitle') : t('productForm.createTitle')}
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
            <Form.Item label={t('productForm.photo')}>
              <Controller name="image" control={control} render={({ field }) => <AvatarUpload value={field.value} onChange={field.onChange} folder="products" shape="square" />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('productForm.name')} validateStatus={formState.errors.name ? 'error' : undefined} help={formState.errors.name?.message}>
              <Controller name="name" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('productForm.category')}>
              <Controller name="category" control={control} render={({ field }) => <Input {...field} />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('productForm.unit')}>
              <Controller
                name="unit"
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
          <Col span={8}>
            <Form.Item label={t('productForm.stock')}>
              <Controller name="stock" control={control} render={({ field }) => <InputNumber {...field} min={0} style={{ width: '100%' }} />} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('productForm.status')}>
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
          <Col span={12}>
            <Form.Item label={t('productForm.purchasePrice')}>
              <Controller
                name="purchasePrice"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('productForm.salePrice')}>
              <Controller
                name="salePrice"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} min={0} style={{ width: '100%' }} formatter={formatThousands} parser={parseThousands} />
                )}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label={t('productForm.description')}>
              <Controller name="description" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
