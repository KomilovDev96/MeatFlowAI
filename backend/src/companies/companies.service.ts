import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(user: any) {
    if (user.role === Role.SUPER_ADMIN) return this.prisma.company.findMany({ orderBy: { createdAt: 'desc' } });
    if (!user.companyId) throw new ForbiddenException('No company scope');
    return this.prisma.company.findMany({ where: { id: user.companyId } });
  }

  async get(id: string, user: any) {
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== id) throw new ForbiddenException('Company scope violation');
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, dto: UpdateCompanyDto, user: any) {
    if (user.role !== Role.SUPER_ADMIN && user.companyId !== id) throw new ForbiddenException('Company scope violation');
    const company = await this.prisma.company.update({ where: { id }, data: dto });
    await this.audit.write({ userId: user.id, companyId: id, action: 'update_company', entity: 'Company', entityId: id });
    return company;
  }
}
