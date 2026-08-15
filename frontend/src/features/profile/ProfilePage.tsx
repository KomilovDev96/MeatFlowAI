import { useMutation, useQuery } from '@tanstack/react-query';
import { Avatar, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { Send, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';
import { telegramApi } from '../../api/telegram.api';
import { PageHeader } from '../../components/ui/PageHeader';
import { displayName } from '../../lib/format';
import { roleLabel, statusLabel } from '../../lib/labels';
import { useAuthStore } from '../../stores/auth.store';

const STATUS_COLOR: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', BLOCKED: 'red' };

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);

  const { data: botStatus } = useQuery({ queryKey: ['telegram', 'status'], queryFn: telegramApi.status, enabled: user?.role === 'ADMIN' });
  const generateCode = useMutation({
    mutationFn: () => authApi.getTelegramCode(),
    onSuccess: setCode,
  });

  if (!user) return null;

  return (
    <>
      <PageHeader title={t('profile.title')} description={t('profile.description')} />
      <Card style={{ maxWidth: 480 }}>
        <Space align="center" size={16} style={{ marginBottom: 20 }}>
          <Avatar size={64} src={user.avatar ?? undefined} icon={<UserRound size={28} />} />
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {displayName(user)}
            </Typography.Title>
            <Space size={8}>
              <Tag color="blue">{roleLabel(user.role)}</Tag>
              {user.status && <Tag color={STATUS_COLOR[user.status]}>{statusLabel(user.status)}</Tag>}
            </Space>
          </div>
        </Space>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={t('profile.login')}>{user.login}</Descriptions.Item>
          <Descriptions.Item label={t('profile.phone')}>{user.phone ?? t('common.notSpecified')}</Descriptions.Item>
          {user.phone2 && <Descriptions.Item label={t('profile.phone2')}>{user.phone2}</Descriptions.Item>}
          {user.company && <Descriptions.Item label={t('profile.company')}>{user.company.name}</Descriptions.Item>}
          {user.lastLoginAt && (
            <Descriptions.Item label={t('profile.lastLogin')}>{dayjs(user.lastLoginAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {user.role === 'ADMIN' && (
        <Card style={{ maxWidth: 480, marginTop: 16 }}>
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {t('profile.telegramBot')}
          </Typography.Title>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Button icon={<Send size={14} />} loading={generateCode.isPending} onClick={() => generateCode.mutate()}>
              {t('profile.getTelegramCodeButton')}
            </Button>
            {code && (
              <Space direction="vertical" size={4} style={{ padding: 12, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                <Typography.Text type="secondary">{t('clientDetail.codeForClient', { time: dayjs(code.expiresAt).format('HH:mm') })}</Typography.Text>
                <Typography.Title level={3} style={{ margin: 0, letterSpacing: 4 }}>
                  {code.code}
                </Typography.Title>
                {botStatus?.botUsername && (
                  <a href={`https://t.me/${botStatus.botUsername}?start=${code.code}`} target="_blank" rel="noreferrer">
                    {t('clientDetail.openInTelegram', { username: botStatus.botUsername })}
                  </a>
                )}
              </Space>
            )}
          </Space>
        </Card>
      )}
    </>
  );
}
