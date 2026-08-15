import { Button, Empty, Result, Skeleton } from 'antd';
import { useTranslation } from 'react-i18next';

export function LoadingState() {
  return <Skeleton active paragraph={{ rows: 4 }} />;
}

export function EmptyState({ title }: { title?: string }) {
  const { t } = useTranslation();
  return <Empty description={title ?? t('common.noDataYet')} />;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return <Result status="warning" title={t('common.somethingWentWrong')} extra={onRetry ? <Button onClick={onRetry}>{t('common.retry')}</Button> : null} />;
}
