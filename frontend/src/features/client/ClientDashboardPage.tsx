import { Card, Descriptions } from 'antd';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuthStore } from '../../stores/auth.store';

export function ClientDashboardPage() {
  const user = useAuthStore((state) => state.user);
  return (
    <>
      <PageHeader title="Profile" description="Client-facing foundation for future account features." />
      <Card>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Name">{user?.fullName ?? 'Client'}</Descriptions.Item>
          <Descriptions.Item label="Role">{user?.role ?? 'CLIENT'}</Descriptions.Item>
          <Descriptions.Item label="Company">{user?.companyId ?? 'Linked company'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
}
