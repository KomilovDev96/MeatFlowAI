import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({ where: { role: Role.ADMIN }, include: { company: true }, orderBy: { createdAt: 'desc' } });
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  }
}
