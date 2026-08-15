import { Avatar, Button, Layout, Menu, Select, Space, Typography } from 'antd';
import { Building2, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { setLanguage } from '../../i18n';
import { displayName } from '../../lib/format';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { navItems } from './navigation';

const { Header, Sider, Content } = Layout;

export function AppLayout({ children }: PropsWithChildren) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const allowedItems = navItems.filter((item) => user && item.roles.includes(user.role));
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const brandLogo = isSuperAdmin ? '/logo.png' : user?.company?.avatar;
  const brandName = isSuperAdmin ? t('layout.appName') : user?.company?.name;

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={248} collapsible collapsed={collapsed} trigger={null} breakpoint="lg" collapsedWidth={72}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: collapsed ? '12px 8px' : '16px',
          }}
        >
          {brandLogo ? (
            <img src={brandLogo} alt={brandName ?? ''} style={{ width: '100%', height: 'auto', borderRadius: 12 }} />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.04)',
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              <Building2 size={collapsed ? 20 : 28} />
            </div>
          )}
          {!collapsed && brandName && (
            <Typography.Text strong style={{ fontSize: 16, textAlign: 'center' }}>
              {brandName}
            </Typography.Text>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[allowedItems.find((item) => item.path === location.pathname)?.key ?? 'dashboard']}
          items={allowedItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{t(item.labelKey)}</Link>,
          }))}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Button type="text" icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />} onClick={toggleSidebar} />
          <Space>
            <Select
              value={i18n.language}
              onChange={(value) => setLanguage(value as 'uz' | 'ru')}
              style={{ width: 90 }}
              options={[
                { value: 'uz', label: "O'zbek" },
                { value: 'ru', label: 'Рус' },
              ]}
            />
            <Avatar src={user?.avatar || undefined}>{user?.firstName?.slice(0, 1)}</Avatar>
            <Typography.Text>{displayName(user)}</Typography.Text>
            <Button icon={<LogOut size={16} />} onClick={logout} />
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <div className="page-shell">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}
