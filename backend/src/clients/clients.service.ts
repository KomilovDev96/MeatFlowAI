import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
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

  create(dto: CreateClientDto, user: any) {
    const companyId = this.companyScope(user);
    return this.prisma.client.create({ data: { ...dto, companyId } }).then(async (client) => {
      await this.audit.write({ userId: user.id, companyId, action: 'create_client', entity: 'Client', entityId: client.id });
      return client;
    });
  }

  list(user: any) {
    if (user.role === Role.SUPER_ADMIN) return this.prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    return this.prisma.client.findMany({ where: { companyId: this.companyScope(user) }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string, user: any) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    if (user.role !== Role.SUPER_ADMIN && client.companyId !== this.companyScope(user)) throw new ForbiddenException('Company scope violation');
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user: any) {
    const current = await this.get(id, user);
    const client = await this.prisma.client.update({ where: { id }, data: dto });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'update_client', entity: 'Client', entityId: id });
    return client;
  }

  async remove(id: string, user: any) {
    const current = await this.get(id, user);
    await this.prisma.client.delete({ where: { id } });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'delete_client', entity: 'Client', entityId: id });
    return { success: true };
  }
}
