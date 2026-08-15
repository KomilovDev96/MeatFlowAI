import { Avatar, Descriptions, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { Building2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { displayName } from '../../lib/format';
import { statusLabel } from '../../lib/labels';
import type { Admin } from '../../types/admin';

const STATUS_COLOR: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', BLOCKED: 'red' };

export function AdminDetailDrawer({ open, onClose, admin }: { open: boolean; onClose: () => void; admin: Admin | null }) {
  const { t } = useTranslation();
  return (
    <Drawer title={t('adminDetail.title')} open={open} onClose={onClose} width={480} destroyOnHidden>
      {admin && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Space align="center" size={16}>
            <Avatar size={64} src={admin.avatar ?? undefined} icon={<UserRound size={28} />} />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {displayName(admin)}
              </Typography.Title>
              <Tag color={STATUS_COLOR[admin.status]}>{statusLabel(admin.status)}</Tag>
            </div>
          </Space>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('adminDetail.login')}>{admin.login}</Descriptions.Item>
            <Descriptions.Item label={t('adminDetail.phone')}>{admin.phone ?? t('common.notSpecified')}</Descriptions.Item>
            <Descriptions.Item label={t('adminDetail.telegram')}>
              {admin.telegramConnected ? (admin.telegramUsername ?? admin.telegramId ?? t('adminDetail.connected')) : t('adminDetail.notConnected')}
            </Descriptions.Item>
            <Descriptions.Item label={t('adminDetail.created')}>{dayjs(admin.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label={t('adminDetail.lastLogin')}>
              {admin.lastLoginAt ? dayjs(admin.lastLoginAt).format('DD.MM.YYYY HH:mm') : t('adminDetail.neverLoggedIn')}
            </Descriptions.Item>
            <Descriptions.Item label={t('adminDetail.lastActivity')}>
              {admin.lastActivityAt ? dayjs(admin.lastActivityAt).format('DD.MM.YYYY HH:mm') : t('common.notSpecified')}
            </Descriptions.Item>
          </Descriptions>

          {admin.company && (
            <div>
              <Typography.Title level={5}>{t('adminDetail.company')}</Typography.Title>
              <Space align="center" size={12}>
                <Avatar shape="square" src={admin.company.avatar ?? undefined} icon={<Building2 size={20} />} />
                <div>
                  <div>{admin.company.name}</div>
                  <Typography.Text type="secondary">
                    {admin.company.phone ?? t('common.notSpecified')} · {admin.company.address ?? t('common.notSpecified')}
                  </Typography.Text>
                </div>
              </Space>
            </div>
          )}
        </Space>
      )}
    </Drawer>
  );
}
