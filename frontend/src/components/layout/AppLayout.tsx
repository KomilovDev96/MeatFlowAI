import { Avatar, Button, Layout, Menu, Space, Switch, Typography } from 'antd';
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { useUiStore } from '../../stores/ui.store';
import { navItems } from './navigation';

const { Header, Sider, Content } = Layout;

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const themeMode = useUiStore((state) => state.themeMode);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const allowedItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const logout = async () => {
    await authApi.logout().catch(() => undefined);
    clearSession();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={248} collapsible collapsed={collapsed} trigger={null} breakpoint="lg" collapsedWidth={72}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: collapsed ? 16 : 20 }}>
          <Typography.Text strong style={{ fontSize: collapsed ? 18 : 20 }}>
            {collapsed ? 'MF' : 'MeatFlow AI'}
          </Typography.Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[allowedItems.find((item) => item.path === location.pathname)?.key ?? 'dashboard']}
          items={allowedItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>,
          }))}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Button type="text" icon={collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />} onClick={toggleSidebar} />
          <Space>
            <Switch checkedChildren="Dark" unCheckedChildren="Light" checked={themeMode === 'dark'} onChange={toggleTheme} />
            <Avatar src={user?.avatar}>{user?.fullName?.slice(0, 1)}</Avatar>
            <Typography.Text>{user?.fullName}</Typography.Text>
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
