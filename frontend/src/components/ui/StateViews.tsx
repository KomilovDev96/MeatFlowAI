import { Button, Empty, Result, Skeleton } from 'antd';

export function LoadingState() {
  return <Skeleton active paragraph={{ rows: 4 }} />;
}

export function EmptyState({ title = 'No data yet' }: { title?: string }) {
  return <Empty description={title} />;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <Result status="warning" title="Something went wrong" extra={onRetry ? <Button onClick={onRetry}>Retry</Button> : null} />;
}
