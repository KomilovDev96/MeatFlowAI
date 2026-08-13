import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  write(data: {
    userId?: string | null;
    companyId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  list() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
