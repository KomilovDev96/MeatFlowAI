import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async platform() {
    const [companies, admins, clients, products] = await Promise.all([
      this.prisma.company.count(),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.client.count(),
      this.prisma.product.count(),
    ]);
    return { companies, admins, clients, products };
  }

  async company(companyId: string, user: any) {
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== companyId) throw new ForbiddenException('Company scope violation');
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Company not found');
    const [clients, products, admins, lastAudit] = await Promise.all([
      this.prisma.client.count({ where: { companyId } }),
      this.prisma.product.count({ where: { companyId } }),
      this.prisma.user.count({ where: { companyId, role: Role.ADMIN } }),
      this.prisma.auditLog.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' } }),
    ]);
    return {
      companyId,
      companyName: company.name,
      companyStatus: company.status,
      createdAt: company.createdAt,
      clients,
      products,
      admins,
      lastActivityAt: lastAudit?.createdAt ?? null,
    };
  }
}
