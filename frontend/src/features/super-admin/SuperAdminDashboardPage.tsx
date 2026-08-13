import { Card, Col, Row, Space } from 'antd';
import { Building2, Package, UserRoundCog, Users } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';

export function SuperAdminDashboardPage() {
  return (
    <>
      <PageHeader title="Platform dashboard" description="System-wide foundation for admins, companies and activity." />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><StatCard title="Companies" value={12} icon={<Building2 size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title="Admins" value={18} icon={<UserRoundCog size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title="Clients" value={248} icon={<Users size={18} />} /></Col>
        <Col xs={24} md={12} xl={6}><StatCard title="Products" value={96} icon={<Package size={18} />} /></Col>
      </Row>
      <Card title="Recent platform activity">
        <Space direction="vertical">
          <span>Admin created for Demo Meat Company</span>
          <span>Company analytics refreshed</span>
          <span>Telegram foundation connected</span>
        </Space>
      </Card>
    </>
  );
}
