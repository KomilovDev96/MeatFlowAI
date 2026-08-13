import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly audit: AuditService) {}

  status() {
    return { configured: Boolean(this.config.get('TELEGRAM_BOT_TOKEN')) };
  }

  async connectUser(userId: string, telegramId: string, telegramUsername?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { telegramId, telegramUsername, telegramConnected: true },
    });
    await this.audit.write({ userId, companyId: user.companyId, action: 'telegram_connection', entity: 'User', entityId: userId });
    return { id: user.id, telegramConnected: user.telegramConnected };
  }

  async connectClient(clientId: string, telegramId: string, telegramUsername?: string, actor?: any) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return null;
    if (actor?.role === Role.ADMIN && actor.companyId !== client.companyId) return null;
    const updated = await this.prisma.client.update({ where: { id: clientId }, data: { telegramId, telegramUsername } });
    await this.audit.write({ userId: actor?.id, companyId: updated.companyId, action: 'telegram_connection', entity: 'Client', entityId: clientId });
    return updated;
  }

  async findByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findUnique({ where: { telegramId }, include: { company: true } });
    if (user) return { type: 'user', role: user.role, companyId: user.companyId, userId: user.id };
    const client = await this.prisma.client.findUnique({ where: { telegramId }, include: { company: true } });
    if (client) return { type: 'client', role: Role.CLIENT, companyId: client.companyId, clientId: client.id };
    return null;
  }
}
