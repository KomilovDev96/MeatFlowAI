import { ConflictException, Injectable } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async createAdmin(dto: CreateAdminDto, actorId: string) {
    const exists = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (exists) throw new ConflictException('Login already exists');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          avatar: dto.companyLogo,
          phone: dto.companyPhone,
          address: dto.companyAddress,
          latitude: dto.companyLatitude,
          longitude: dto.companyLongitude,
          currency: dto.companyCurrency,
          measurementUnit: dto.companyMeasurementUnit,
          status: dto.status ?? Status.ACTIVE,
        },
      });
      const admin = await tx.user.create({
        data: {
          role: Role.ADMIN,
          firstName: dto.firstName,
          lastName: dto.lastName,
          avatar: dto.avatar,
          login: dto.login,
          passwordHash,
          phone: dto.phone,
          telegramId: dto.telegramId,
          telegramUsername: dto.telegramUsername,
          telegramConnected: Boolean(dto.telegramId),
          status: dto.status ?? Status.ACTIVE,
          companyId: company.id,
        },
      });
      return { company, admin: this.sanitize(admin) };
    });
    await this.audit.write({ userId: actorId, companyId: result.company.id, action: 'create_admin', entity: 'User', entityId: result.admin.id });
    return result;
  }

  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
