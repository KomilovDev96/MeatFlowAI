import { Button, Card, Col, Row, Space } from 'antd';
import { PackagePlus, UserPlus, Users, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';

export function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Company dashboard" description="Operational overview for clients, products and activity." />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}><StatCard title="Clients" value={42} icon={<Users size={18} />} /></Col>
        <Col xs={24} md={12}><StatCard title="Products" value={28} icon={<Package size={18} />} /></Col>
      </Row>
      <Card title="Quick actions">
        <Space wrap>
          <Button type="primary" icon={<UserPlus size={16} />}>Add client</Button>
          <Button icon={<PackagePlus size={16} />}>Add product</Button>
        </Space>
      </Card>
    </>
  );
}
