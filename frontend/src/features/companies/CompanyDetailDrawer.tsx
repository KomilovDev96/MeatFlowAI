import { useQuery } from '@tanstack/react-query';
import { Avatar, Descriptions, Drawer, Empty, Skeleton, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Building2 } from 'lucide-react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { adminsApi } from '../../api/admins.api';
import { analyticsApi } from '../../api/analytics.api';
import { StatCard } from '../../components/ui/StatCard';
import { displayName } from '../../lib/format';
import { statusLabel, unitLabel } from '../../lib/labels';
import type { Company } from '../../types/company';

const markerPin = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const STATUS_COLOR: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'default', BLOCKED: 'red' };

export function CompanyDetailDrawer({ open, onClose, company }: { open: boolean; onClose: () => void; company: Company | null }) {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'company', company?.id],
    queryFn: () => analyticsApi.company(company!.id),
    enabled: open && Boolean(company),
  });
  const { data: admins } = useQuery({ queryKey: ['admins'], queryFn: adminsApi.list, enabled: open });
  const companyAdmins = admins?.filter((admin) => admin.companyId === company?.id) ?? [];

  return (
    <Drawer title={t('companyDetail.title')} open={open} onClose={onClose} width={480} destroyOnHidden>
      {company && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Space align="center" size={16}>
            <Avatar size={64} shape="square" src={company.avatar ?? undefined} icon={<Building2 size={28} />} />
            <div>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {company.name}
              </Typography.Title>
              <Tag color={STATUS_COLOR[company.status]}>{statusLabel(company.status)}</Tag>
            </div>
          </Space>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('companyDetail.phone')}>{company.phone ?? t('common.notSpecified')}</Descriptions.Item>
            <Descriptions.Item label={t('companyDetail.address')}>{company.address ?? t('common.notSpecified')}</Descriptions.Item>
            <Descriptions.Item label={t('companyDetail.currency')}>{company.currency}</Descriptions.Item>
            <Descriptions.Item label={t('companyDetail.measurementUnit')}>{unitLabel(company.measurementUnit)}</Descriptions.Item>
            <Descriptions.Item label={t('companyDetail.created')}>{dayjs(company.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          </Descriptions>

          {company.latitude != null && company.longitude != null && (
            <div style={{ height: 200, borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer
                center={[company.latitude, company.longitude]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                dragging={false}
                zoomControl={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[company.latitude, company.longitude]} icon={markerPin} />
              </MapContainer>
            </div>
          )}

          <div>
            <Typography.Title level={5}>{t('companyDetail.statistics')}</Typography.Title>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 2 }} />
            ) : (
              <>
                <Space wrap size={12}>
                  <StatCard title={t('companyDetail.admins')} value={stats?.admins ?? 0} />
                  <StatCard title={t('companyDetail.clients')} value={stats?.clients ?? 0} />
                  <StatCard title={t('companyDetail.products')} value={stats?.products ?? 0} />
                  <StatCard title={t('companyDetail.sales')} value={stats?.sales ?? 0} />
                </Space>
                {stats?.lastActivityAt && (
                  <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
                    {t('companyDetail.lastActivity')}: {dayjs(stats.lastActivityAt).format('DD.MM.YYYY HH:mm')}
                  </Typography.Paragraph>
                )}
              </>
            )}
          </div>

          <div>
            <Typography.Title level={5}>{t('companyDetail.administrators')}</Typography.Title>
            {companyAdmins.length === 0 ? (
              <Empty description={t('companyDetail.noAdmins')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {companyAdmins.map((admin) => (
                  <Space key={admin.id} align="center">
                    <Avatar src={admin.avatar ?? undefined}>{admin.firstName.slice(0, 1)}</Avatar>
                    <div>
                      <div>{displayName(admin)}</div>
                      <Typography.Text type="secondary">
                        {admin.login} · {admin.phone ?? t('common.notSpecified')}
                      </Typography.Text>
                    </div>
                  </Space>
                ))}
              </Space>
            )}
          </div>
        </Space>
      )}
    </Drawer>
  );
}
