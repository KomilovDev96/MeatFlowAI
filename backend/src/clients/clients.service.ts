import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId;
  }

  findByLogin(login: string) {
    return this.prisma.client.findUnique({ where: { login }, include: { company: true } });
  }

  findById(id: string) {
    return this.prisma.client.findUnique({ where: { id }, include: { company: true } });
  }

  sanitize<T extends { passwordHash?: string | null } | null>(client: T) {
    if (!client) return client;
    const { passwordHash: _passwordHash, ...safe } = client;
    return safe;
  }

  private async assertLoginAvailable(login: string, excludeClientId?: string) {
    const [existingUser, existingClient] = await Promise.all([
      this.prisma.user.findUnique({ where: { login } }),
      this.prisma.client.findUnique({ where: { login } }),
    ]);
    if (existingUser || (existingClient && existingClient.id !== excludeClientId)) {
      throw new ConflictException('Login already exists');
    }
  }

  async create(dto: CreateClientDto, user: any) {
    const companyId = this.companyScope(user);
    const { login, password, ...rest } = dto;
    if (login && !password) throw new BadRequestException('Password is required when login is set');
    if (login) await this.assertLoginAvailable(login);
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    const client = await this.prisma.client.create({ data: { ...rest, login, passwordHash, companyId } });
    await this.audit.write({ userId: user.id, companyId, action: 'create_client', entity: 'Client', entityId: client.id });
    return this.sanitize(client);
  }

  async list(user: any) {
    const clients =
      user.role === Role.SUPER_ADMIN
        ? await this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } })
        : await this.prisma.client.findMany({ where: { companyId: this.companyScope(user) }, orderBy: { createdAt: 'desc' } });
    return clients.map((client) => this.sanitize(client));
  }

  private async findScoped(id: string, user: any) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    if (user.role !== Role.SUPER_ADMIN && client.companyId !== this.companyScope(user)) throw new ForbiddenException('Company scope violation');
    return client;
  }

  async get(id: string, user: any) {
    return this.sanitize(await this.findScoped(id, user));
  }

  async update(id: string, dto: UpdateClientDto, user: any) {
    const current = await this.findScoped(id, user);
    const { login, password, ...rest } = dto;
    if (login !== undefined && login !== current.login) await this.assertLoginAvailable(login, id);
    if (password && !login && !current.login) throw new BadRequestException('Login is required to set a password');
    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined;

    const client = await this.prisma.client.update({
      where: { id },
      data: { ...rest, ...(login !== undefined ? { login } : {}), ...(passwordHash ? { passwordHash } : {}) },
    });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'update_client', entity: 'Client', entityId: id });
    return this.sanitize(client);
  }

  async generateTelegramCode(id: string, user: any) {
    await this.findScoped(id, user);
    let code = '';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = String(Math.floor(1000 + Math.random() * 9000));
      const collision = await this.prisma.client.findUnique({ where: { telegramConnectCode: candidate } });
      if (!collision) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new BadRequestException('Не удалось сгенерировать код, попробуйте ещё раз');

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.client.update({ where: { id }, data: { telegramConnectCode: code, telegramConnectCodeExpiresAt: expiresAt } });
    return { code, expiresAt };
  }

  async remove(id: string, user: any) {
    const current = await this.findScoped(id, user);
    const salesCount = await this.prisma.sale.count({ where: { clientId: id } });
    if (salesCount > 0) throw new ConflictException('У клиента есть заказы — сначала удалите их');
    await this.prisma.client.delete({ where: { id } });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'delete_client', entity: 'Client', entityId: id });
    return { success: true };
  }
}
