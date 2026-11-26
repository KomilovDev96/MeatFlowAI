import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Alert, Button, Card, Descriptions, Form, Input, Popconfirm, Space, Tag } from 'antd';
import { Bot, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { telegramApi } from '../../api/telegram.api';
import { PageHeader } from '../../components/ui/PageHeader';

export function TelegramBotPage() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [token, setToken] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['telegram-bot'], queryFn: telegramApi.botConfig });

  const errorText = (error: unknown, fallback: string) =>
    (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message?.toString() ?? fallback;

  const saveMutation = useMutation({
    mutationFn: () => telegramApi.setToken(token),
    onSuccess: (config) => {
      message.success(t('telegramBot.saved', { username: config.botUsername ?? '' }));
      setToken('');
      queryClient.setQueryData(['telegram-bot'], config);
      queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (error) => message.error(errorText(error, t('telegramBot.saveFailed'))),
  });

  const removeMutation = useMutation({
    mutationFn: telegramApi.removeToken,
    onSuccess: (config) => {
      message.success(t('telegramBot.removed'));
      queryClient.setQueryData(['telegram-bot'], config);
      queryClient.invalidateQueries({ queryKey: ['telegram-status'] });
    },
    onError: (error) => message.error(errorText(error, t('telegramBot.removeFailed'))),
  });

  const hasToken = Boolean(data?.configured);

  return (
    <>
      <PageHeader title={t('telegramBot.title')} description={t('telegramBot.description')} />
      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
        <Card loading={isLoading} title={t('telegramBot.statusTitle')}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('telegramBot.state')}>
              {data?.running ? <Tag color="green">{t('telegramBot.running')}</Tag> : <Tag color={hasToken ? 'orange' : 'default'}>{hasToken ? t('telegramBot.notRunning') : t('telegramBot.notConfigured')}</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label={t('telegramBot.bot')}>
              {data?.botUsername ? (
                <a href={`https://t.me/${data.botUsername}`} target="_blank" rel="noreferrer">
                  @{data.botUsername}
                </a>
              ) : (
                t('common.notSpecified')
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('telegramBot.token')}>
              <code>{data?.tokenMasked ?? t('common.notSpecified')}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('telegramBot.source')}>{t(`telegramBot.source_${data?.source ?? 'none'}`)}</Descriptions.Item>
          </Descriptions>
          {data?.source === 'env' ? <Alert style={{ marginTop: 12 }} type="info" showIcon message={t('telegramBot.envHint')} /> : null}
          {hasToken ? (
            <Popconfirm title={t('telegramBot.deleteConfirm')} okText={t('common.delete')} cancelText={t('common.cancel')} onConfirm={() => removeMutation.mutate()}>
              <Button danger icon={<Trash2 size={14} />} loading={removeMutation.isPending} style={{ marginTop: 16 }}>
                {t('telegramBot.deleteButton')}
              </Button>
            </Popconfirm>
          ) : null}
        </Card>

        <Card title={hasToken ? t('telegramBot.replaceTitle') : t('telegramBot.addTitle')}>
          <Form layout="vertical" onFinish={() => saveMutation.mutate()}>
            <Form.Item label={t('telegramBot.tokenLabel')} extra={t('telegramBot.tokenHelp')}>
              <Input.Password value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:AA..." autoComplete="off" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<Bot size={16} />} disabled={!token.trim()} loading={saveMutation.isPending}>
              {hasToken ? t('telegramBot.replaceButton') : t('telegramBot.addButton')}
            </Button>
          </Form>
        </Card>
      </Space>
    </>
  );
}
