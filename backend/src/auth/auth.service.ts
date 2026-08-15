import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { verifyTelegramWebAppInitData } from '../telegram/telegram-webapp.util';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly clients: ClientsService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const user = await this.users.findByLogin(dto.login);
    if (user) {
      if (user.status !== Status.ACTIVE) throw new UnauthorizedException('Invalid credentials');
      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid credentials');

      await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date() } });
      const tokens = await this.issueTokens(user.id, user.role);
      await this.audit.write({ userId: user.id, companyId: user.companyId, action: 'login', entity: 'Auth', ip: context?.ip, userAgent: context?.userAgent });
      return { user: this.users.sanitize(user), ...tokens };
    }

    const client = await this.clients.findByLogin(dto.login);
    if (!client || !client.passwordHash || client.status !== Status.ACTIVE) throw new UnauthorizedException('Invalid credentials');
    const validClient = await bcrypt.compare(dto.password, client.passwordHash);
    if (!validClient) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.client.update({ where: { id: client.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date() } });
    const clientTokens = await this.issueTokens(client.id, Role.CLIENT);
    await this.audit.write({ userId: client.id, companyId: client.companyId, action: 'login', entity: 'Auth', ip: context?.ip, userAgent: context?.userAgent });
    return { user: { ...this.clients.sanitize(client), role: Role.CLIENT }, ...clientTokens };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwt.verifyAsync<{ sub: string; role: Role; jti: string }>(refreshToken, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    const token = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!token || token.revokedAt || token.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    const matches = await bcrypt.compare(refreshToken, token.tokenHash);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });

    if (payload.role === Role.CLIENT) {
      const client = await this.clients.findById(payload.sub);
      if (!client) throw new UnauthorizedException('Invalid refresh token');
      return this.issueTokens(client.id, Role.CLIENT);
    }
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return this.issueTokens(user.id, user.role);
  }

  async generateTelegramCodeForUser(userId: string) {
    let code = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = String(Math.floor(1000 + Math.random() * 9000));
      const collision = await this.prisma.user.findUnique({ where: { telegramConnectCode: candidate } });
      if (!collision) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new BadRequestException('Не удалось сгенерировать код, попробуйте ещё раз');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.user.update({ where: { id: userId }, data: { telegramConnectCode: code, telegramConnectCodeExpiresAt: expiresAt } });
    return { code, expiresAt };
  }

  async loginWithTelegram(initData: string, context?: { ip?: string; userAgent?: string }) {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const verified = botToken ? verifyTelegramWebAppInitData(initData, botToken) : null;
    if (!verified) throw new UnauthorizedException('Invalid Telegram data');

    const user = await this.users.findByTelegramId(verified.id);
    if (!user || user.status !== Status.ACTIVE || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
      throw new UnauthorizedException('Telegram account is not linked to an admin');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date() } });
    const tokens = await this.issueTokens(user.id, user.role);
    await this.audit.write({ userId: user.id, companyId: user.companyId, action: 'login_telegram_webapp', entity: 'Auth', ip: context?.ip, userAgent: context?.userAgent });
    return { user: this.users.sanitize(user), ...tokens };
  }

  async logout(userId: string, role: Role) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    const subject = role === Role.CLIENT ? await this.clients.findById(userId) : await this.users.findById(userId);
    await this.audit.write({ userId, companyId: subject?.companyId, action: 'logout', entity: 'Auth' });
    return { success: true };
  }

  private async issueTokens(userId: string, role: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_TTL', '15m') },
    );
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, role, jti },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_TTL', '7d') },
    );
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 12),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
}
