import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, SaleType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

const PAYMENT_INCLUDE = { client: { omit: { passwordHash: true } } } as const;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId;
  }

  async create(dto: CreatePaymentDto, user: any) {
    const companyId = this.companyScope(user);
    const client = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
    if (!client || client.companyId !== companyId) throw new NotFoundException('Client not found');

    const company = await this.prisma.company.findUniqueOrThrow({ where: { id: companyId } });
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        clientId: dto.clientId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method,
        currency: dto.currency ?? company.currency,
        note: dto.note,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        createdById: user.id,
      },
      include: PAYMENT_INCLUDE,
    });
    await this.audit.write({ userId: user.id, companyId, action: 'create_payment', entity: 'Payment', entityId: payment.id });
    return payment;
  }

  list(user: any) {
    if (user.role === Role.SUPER_ADMIN) return this.prisma.payment.findMany({ include: PAYMENT_INCLUDE, orderBy: { paidAt: 'desc' } });
    return this.prisma.payment.findMany({ where: { companyId: this.companyScope(user) }, include: PAYMENT_INCLUDE, orderBy: { paidAt: 'desc' } });
  }

  listForClient(clientId: string, companyId: string) {
    return this.prisma.payment.findMany({ where: { clientId, companyId }, orderBy: { paidAt: 'desc' } });
  }

  async debtSummaryForUser(clientId: string, user: any) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (user.role !== Role.SUPER_ADMIN && client.companyId !== this.companyScope(user)) throw new ForbiddenException('Company scope violation');
    return this.debtSummary(clientId, client.companyId);
  }

  async debtSummary(clientId: string, companyId: string) {
    const [ordersAgg, paidAgg] = await Promise.all([
      this.prisma.sale.aggregate({ where: { clientId, companyId, type: SaleType.CONSIGNMENT }, _sum: { totalAmount: true } }),
      this.prisma.payment.aggregate({ where: { clientId, companyId }, _sum: { amount: true } }),
    ]);
    const ordersDebt = ordersAgg._sum.totalAmount ?? new Prisma.Decimal(0);
    const totalPaid = paidAgg._sum.amount ?? new Prisma.Decimal(0);
    const diff = ordersDebt.sub(totalPaid);
    const qarz = diff.isNegative() ? new Prisma.Decimal(0) : diff;
    const balans = diff.isNegative() ? diff.neg() : new Prisma.Decimal(0);
    return {
      ordersDebt: ordersDebt.toString(),
      totalPaid: totalPaid.toString(),
      qarz: qarz.toString(),
      balans: balans.toString(),
    };
  }

  async remove(id: string, user: any) {
    const companyId = this.companyScope(user);
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment || payment.companyId !== companyId) throw new NotFoundException('Payment not found');
    await this.prisma.payment.delete({ where: { id } });
    await this.audit.write({ userId: user.id, companyId, action: 'delete_payment', entity: 'Payment', entityId: id });
    return { success: true };
  }
}
