import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, Input, Typography } from 'antd';
import { Lock, User } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';

const schema = z.object({
  login: z.string().min(1),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { login: 'admin', password: 'Password123!' },
  });

  const submit = handleSubmit(async (values) => {
    const session = await authApi.login(values);
    setSession(session);
    navigate('/');
  });

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f7f8fa' }}>
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Typography.Title level={2} style={{ marginTop: 0 }}>MeatFlow AI</Typography.Title>
        <Typography.Paragraph type="secondary">Business dashboard access</Typography.Paragraph>
        <Form layout="vertical" onFinish={submit}>
          <Form.Item label="Login" validateStatus={formState.errors.login ? 'error' : undefined}>
            <Controller name="login" control={control} render={({ field }) => <Input {...field} prefix={<User size={16} />} />} />
          </Form.Item>
          <Form.Item label="Password" validateStatus={formState.errors.password ? 'error' : undefined}>
            <Controller name="password" control={control} render={({ field }) => <Input.Password {...field} prefix={<Lock size={16} />} />} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={formState.isSubmitting}>Sign in</Button>
        </Form>
      </Card>
    </main>
  );
}
