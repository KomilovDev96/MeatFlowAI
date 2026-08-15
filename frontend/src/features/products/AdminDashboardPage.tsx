import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Row, Space } from 'antd';
import { PackagePlus, UserPlus, Users, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '../../api/analytics.api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { useAuthStore } from '../../stores/auth.store';

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.user?.companyId);
  const { data } = useQuery({
    queryKey: ['analytics', 'company', companyId],
    queryFn: () => analyticsApi.company(companyId as string),
    enabled: Boolean(companyId),
  });

  return (
    <>
      <PageHeader title={t('adminDashboard.title')} description={t('adminDashboard.description')} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}><StatCard title={t('adminDashboard.clients')} value={data?.clients ?? 0} icon={<Users size={18} />} /></Col>
        <Col xs={24} md={12}><StatCard title={t('adminDashboard.products')} value={data?.products ?? 0} icon={<Package size={18} />} /></Col>
      </Row>
      <Card title={t('adminDashboard.quickActions')}>
        <Space wrap>
          <Button type="primary" icon={<UserPlus size={16} />}>{t('adminDashboard.addClient')}</Button>
          <Button icon={<PackagePlus size={16} />}>{t('adminDashboard.addProduct')}</Button>
        </Space>
      </Card>
    </>
  );
}
