import { Card, Col, Row } from 'antd';
import { Line } from '@ant-design/charts';
import { ChartCard } from '../../components/charts/ChartCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';

const data = [
  { day: 'Mon', value: 12 },
  { day: 'Tue', value: 18 },
  { day: 'Wed', value: 15 },
  { day: 'Thu', value: 26 },
  { day: 'Fri', value: 21 },
];

export function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" description="Expandable analytics foundation without sales/profit assumptions." />
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}><StatCard title="Clients" value={248} /></Col>
        <Col xs={24} md={8}><StatCard title="Products" value={96} /></Col>
        <Col xs={24} md={8}><StatCard title="Activity" value={42} /></Col>
      </Row>
      <ChartCard title="Activity trend">
        <Line data={data} xField="day" yField="value" height={260} />
      </ChartCard>
      <Card title="Analytics scope">Financial metrics are intentionally reserved for future business modules.</Card>
    </>
  );
}
