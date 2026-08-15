import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Alert, Button, Drawer, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '../../api/analytics.api';
import { companiesApi } from '../../api/companies.api';
import type { Company } from '../../types/company';

export function DeleteCompanyModal({ open, onClose, company }: { open: boolean; onClose: () => void; company: Company | null }) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');

  const close = () => {
    setConfirmText('');
    onClose();
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'company', company?.id],
    queryFn: () => analyticsApi.company(company!.id),
    enabled: open && Boolean(company),
  });

  const mutation = useMutation({
    mutationFn: () => companiesApi.remove(company!.id),
    onSuccess: () => {
      message.success(t('companies.deletedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      close();
    },
    onError: (error: unknown) => {
      const description = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('companies.deleteFailed');
      message.error(description);
    },
  });

  const matches = company != null && confirmText.trim() === company.name;

  return (
    <Drawer
      title={t('companies.deleteTitle')}
      open={open}
      onClose={close}
      placement="right"
      width="50%"
      destroyOnHidden
      footer={
        <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={close}>{t('common.cancel')}</Button>
          <Button danger disabled={!matches} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {t('companies.deleteForever')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert type="error" showIcon message={t('companies.deleteIrreversible')} description={t('companies.deleteIrreversibleDesc')} />
        {company && (
          <Typography.Paragraph>
            {t('companies.willBeDeleted', { name: company.name })}{' '}
            {statsLoading
              ? '...'
              : `${t('companyDetail.admins')} — ${stats?.admins ?? 0}, ${t('companyDetail.clients')} — ${stats?.clients ?? 0}, ${t('companyDetail.products')} — ${stats?.products ?? 0}, ${t('companyDetail.sales')} — ${stats?.sales ?? 0}.`}
          </Typography.Paragraph>
        )}
        <Typography.Text>
          {t('companies.confirmByTyping')} <Typography.Text strong>{company?.name}</Typography.Text>
        </Typography.Text>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={company?.name} autoComplete="off" />
      </Space>
    </Drawer>
  );
}
