import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list() {
    const users = await this.prisma.user.findMany({ where: { role: Role.ADMIN }, include: { company: true }, orderBy: { createdAt: 'desc' } });
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }

  private async findAdmin(id: string) {
    const admin = await this.prisma.user.findUnique({ where: { id } });
    if (!admin || admin.role !== Role.ADMIN) throw new NotFoundException('Admin not found');
    return admin;
  }

  async update(id: string, dto: UpdateAdminDto, actorId: string) {
    await this.findAdmin(id);
    const admin = await this.prisma.user.update({ where: { id }, data: dto, include: { company: true } });
    await this.audit.write({ userId: actorId, companyId: admin.companyId, action: 'update_admin', entity: 'User', entityId: id });
    const { passwordHash: _passwordHash, ...safe } = admin;
    return safe;
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException('Cannot delete your own account');
    const admin = await this.findAdmin(id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit.write({ userId: actorId, companyId: admin.companyId, action: 'delete_admin', entity: 'User', entityId: id });
    return { success: true };
  }
}
