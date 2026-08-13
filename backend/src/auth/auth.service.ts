import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, context?: { ip?: string; userAgent?: string }) {
    const user = await this.users.findByLogin(dto.login);
    if (!user || user.status !== Status.ACTIVE) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastActivityAt: new Date() } });
    const tokens = await this.issueTokens(user.id, user.role);
    await this.audit.write({ userId: user.id, companyId: user.companyId, action: 'login', entity: 'Auth', ip: context?.ip, userAgent: context?.userAgent });
    return { user: this.users.sanitize(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwt.verifyAsync<{ sub: string; jti: string }>(refreshToken, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    const token = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!token || token.revokedAt || token.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');
    const matches = await bcrypt.compare(refreshToken, token.tokenHash);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');
    await this.prisma.refreshToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    return this.issueTokens(user.id, user.role);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    const user = await this.users.findById(userId);
    await this.audit.write({ userId, companyId: user?.companyId, action: 'logout', entity: 'Auth' });
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
