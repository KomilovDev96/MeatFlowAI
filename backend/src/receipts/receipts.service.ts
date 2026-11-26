import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';

const RECEIPT_INCLUDE = { product: { select: { id: true, name: true, unit: true } } } as const;

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId as string;
  }

  /** Stock goes up; purchasePrice becomes the weighted-average cost of what is on hand. */
  async create(dto: CreateReceiptDto, user: any) {
    const companyId = this.companyScope(user);
    const receipt = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!product || product.companyId !== companyId) throw new NotFoundException('Product not found');

      const quantity = new Prisma.Decimal(dto.quantity);
      const unitCost = new Prisma.Decimal(dto.unitCost);
      const totalCost = quantity.mul(unitCost);

      const newStock = product.stock.add(quantity);
      const onHandValue = product.stock.greaterThan(0) ? product.stock.mul(product.purchasePrice) : new Prisma.Decimal(0);
      const avgCost = onHandValue.add(totalCost).div(newStock).toDecimalPlaces(2);

      await tx.product.update({ where: { id: product.id }, data: { stock: newStock, purchasePrice: avgCost } });

      return tx.stockReceipt.create({
        data: {
          companyId,
          productId: product.id,
          quantity,
          unitCost,
          totalCost,
          supplier: dto.supplier,
          note: dto.note,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          createdById: user.id,
        },
        include: RECEIPT_INCLUDE,
      });
    });
    await this.audit.write({ userId: user.id, companyId, action: 'create_receipt', entity: 'StockReceipt', entityId: receipt.id });
    return receipt;
  }

  list(user: any, productId?: string) {
    return this.prisma.stockReceipt.findMany({
      where: { companyId: this.companyScope(user), ...(productId ? { productId } : {}) },
      include: RECEIPT_INCLUDE,
      orderBy: { receivedAt: 'desc' },
    });
  }

  /** Removing a receipt takes the goods back off the shelf (refused if they were already sold). */
  async remove(id: string, user: any) {
    const companyId = this.companyScope(user);
    const current = await this.prisma.stockReceipt.findUnique({ where: { id } });
    if (!current || current.companyId !== companyId) throw new NotFoundException('Receipt not found');
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({ where: { id: current.productId } });
      if (product.stock.lessThan(current.quantity)) {
        throw new BadRequestException('Нельзя удалить приход: товар уже продан');
      }
      await tx.product.update({ where: { id: product.id }, data: { stock: product.stock.sub(current.quantity) } });
      await tx.stockReceipt.delete({ where: { id } });
    });
    await this.audit.write({ userId: user.id, companyId, action: 'delete_receipt', entity: 'StockReceipt', entityId: id });
    return { success: true };
  }
}
