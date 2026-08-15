import { createHmac } from 'crypto';

export type TelegramWebAppUser = {
  id: string;
  username?: string;
  firstName?: string;
};

export function verifyTelegramWebAppInitData(initData: string, botToken: string, maxAgeSeconds = 3600): TelegramWebAppUser | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computedHash !== hash) return null;

  const authDate = Number(params.get('auth_date') ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  const userRaw = params.get('user');
  if (!userRaw) return null;
  const user = JSON.parse(userRaw);
  return { id: String(user.id), username: user.username, firstName: user.first_name };
}
