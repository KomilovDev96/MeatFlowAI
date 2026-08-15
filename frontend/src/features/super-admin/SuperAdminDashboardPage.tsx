import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Space } from 'antd';
import dayjs from 'dayjs';
import { Building2, Package, UserRoundCog, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '../../api/analytics.api';
import { auditApi } from '../../api/audit.api';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { actionLabel } from '../../lib/labels';

export function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const { data: platform } = useQuery({ queryKey: ['analytics', 'platform'], queryFn: analyticsApi.platform });
  const { data: auditLog } = useQuery({ queryKey: ['audit'], queryFn: auditApi.list });
  const recentActivity = auditLog?.slice(0, 5) ?? [];

  return (
    <>
      <PageHeader title={t('superAdminDashboard.title')} description={t('superAdminDashboard.description')} />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><StatCard title={t('superAdminDashboard.companies')} value={platform?.companies ?? 0} icon={<Building2 size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={t('superAdminDashboard.admins')} value={platform?.admins ?? 0} icon={<UserRoundCog size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={t('superAdminDashboard.clients')} value={platform?.clients ?? 0} icon={<Users size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title={t('superAdminDashboard.products')} value={platform?.products ?? 0} icon={<Package size={18} />} /></Col>
      </Row>
      <Card title={t('superAdminDashboard.recentActivity')}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {recentActivity.length === 0 && <span>{t('superAdminDashboard.noActivity')}</span>}
          {recentActivity.map((entry) => (
            <span key={entry.id}>
              {actionLabel(entry.action)} — {dayjs(entry.createdAt).format('DD.MM.YYYY HH:mm')}
            </span>
          ))}
        </Space>
      </Card>
    </>
  );
}
