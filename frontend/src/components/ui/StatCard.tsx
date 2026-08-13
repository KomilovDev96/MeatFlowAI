import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: number | string;
  icon?: ReactNode;
};

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <Statistic title={title} value={value} prefix={icon} />
    </Card>
  );
}
