import { Card } from 'antd';
import type { ReactNode } from 'react';

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card title={title}>{children}</Card>;
}
