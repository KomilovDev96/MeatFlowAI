import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByLogin(login: string) {
    return this.prisma.user.findUnique({ where: { login }, include: { company: true } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { company: true } });
  }

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId }, include: { company: true } });
  }

  sanitize<T extends { passwordHash?: string } | null>(user: T) {
    if (!user) return user;
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
