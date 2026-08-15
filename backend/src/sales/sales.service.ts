import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductUnit, Role, SaleType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, CreateSaleItemDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';

const SALE_INCLUDE = { client: { omit: { passwordHash: true } }, items: { include: { product: true } } } as const;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId;
  }

  private stockDelta(unit: ProductUnit, quantityPieces: Prisma.Decimal, quantityKg: Prisma.Decimal) {
    return unit === ProductUnit.PIECE ? quantityPieces : quantityKg;
  }

  async create(dto: CreateSaleDto, user: any) {
    const companyId = this.companyScope(user);
    const sale = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.findUnique({ where: { id: dto.clientId } });
      if (!client || client.companyId !== companyId) throw new NotFoundException('Client not found');

      const type = dto.type ?? SaleType.CASH;
      const soldAt = dto.soldAt ? new Date(dto.soldAt) : new Date();

      let totalAmount = new Prisma.Decimal(0);
      const itemsData: Prisma.SaleItemCreateManySaleInput[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.companyId !== companyId) throw new NotFoundException('Product not found');

        const quantityPieces = new Prisma.Decimal(item.quantityPieces);
        const quantityKg = new Prisma.Decimal(item.quantityKg);
        const pricePerKg = new Prisma.Decimal(item.pricePerKg ?? product.salePrice);
        const itemTotal = quantityKg.mul(pricePerKg);

        const delta = this.stockDelta(product.unit, quantityPieces, quantityKg);
        if (product.stock.lessThan(delta)) throw new BadRequestException(`Недостаточно товара на складе: ${product.name}`);
        await tx.product.update({ where: { id: product.id }, data: { stock: product.stock.sub(delta) } });

        totalAmount = totalAmount.add(itemTotal);
        itemsData.push({ productId: item.productId, quantityPieces, quantityKg, pricePerKg, totalAmount: itemTotal });
      }

      return tx.sale.create({
        data: {
          companyId,
          clientId: dto.clientId,
          type,
          soldAt,
          paidAt: type === SaleType.CASH ? soldAt : null,
          soldById: user.id,
          note: dto.note,
          totalAmount,
          items: { create: itemsData },
        },
        include: SALE_INCLUDE,
      });
    });
    await this.audit.write({ userId: user.id, companyId, action: 'create_sale', entity: 'Sale', entityId: sale.id });
    return sale;
  }

  list(user: any) {
    if (user.role === Role.SUPER_ADMIN) return this.prisma.sale.findMany({ include: SALE_INCLUDE, orderBy: { soldAt: 'desc' } });
    return this.prisma.sale.findMany({ where: { companyId: this.companyScope(user) }, include: SALE_INCLUDE, orderBy: { soldAt: 'desc' } });
  }

  listForClient(clientId: string, companyId: string) {
    return this.prisma.sale.findMany({
      where: { clientId, companyId },
      include: { items: { include: { product: true } } },
      orderBy: { soldAt: 'desc' },
    });
  }

  async get(id: string, user: any) {
    const sale = await this.prisma.sale.findUnique({ where: { id }, include: SALE_INCLUDE });
    if (!sale) throw new NotFoundException('Sale not found');
    if (user.role !== Role.SUPER_ADMIN && sale.companyId !== this.companyScope(user)) throw new ForbiddenException('Company scope violation');
    return sale;
  }

  private async restoreStock(tx: Prisma.TransactionClient, items: { productId: string; quantityPieces: Prisma.Decimal; quantityKg: Prisma.Decimal }[]) {
    for (const item of items) {
      const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
      const delta = this.stockDelta(product.unit, item.quantityPieces, item.quantityKg);
      await tx.product.update({ where: { id: product.id }, data: { stock: product.stock.add(delta) } });
    }
  }

  private async consumeStock(tx: Prisma.TransactionClient, companyId: string, items: CreateSaleItemDto[]) {
    let totalAmount = new Prisma.Decimal(0);
    const itemsData: Prisma.SaleItemCreateManySaleInput[] = [];
    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.companyId !== companyId) throw new NotFoundException('Product not found');

      const quantityPieces = new Prisma.Decimal(item.quantityPieces);
      const quantityKg = new Prisma.Decimal(item.quantityKg);
      const pricePerKg = new Prisma.Decimal(item.pricePerKg ?? product.salePrice);
      const itemTotal = quantityKg.mul(pricePerKg);

      const delta = this.stockDelta(product.unit, quantityPieces, quantityKg);
      if (product.stock.lessThan(delta)) throw new BadRequestException(`Недостаточно товара на складе: ${product.name}`);
      await tx.product.update({ where: { id: product.id }, data: { stock: product.stock.sub(delta) } });

      totalAmount = totalAmount.add(itemTotal);
      itemsData.push({ productId: item.productId, quantityPieces, quantityKg, pricePerKg, totalAmount: itemTotal });
    }
    return { totalAmount, itemsData };
  }

  async update(id: string, dto: UpdateSaleDto, user: any) {
    const companyId = this.companyScope(user);
    const current = await this.prisma.sale.findUnique({ where: { id }, include: { items: true } });
    if (!current || current.companyId !== companyId) throw new NotFoundException('Sale not found');

    const sale = await this.prisma.$transaction(async (tx) => {
      let totalAmount = current.totalAmount;

      if (dto.items) {
        await this.restoreStock(tx, current.items);
        await tx.saleItem.deleteMany({ where: { saleId: id } });
        const result = await this.consumeStock(tx, companyId, dto.items);
        totalAmount = result.totalAmount;
        await tx.sale.update({ where: { id }, data: { items: { create: result.itemsData } } });
      }

      const paidAt = dto.isPaid === undefined ? current.paidAt : dto.isPaid ? (current.paidAt ?? new Date()) : null;

      return tx.sale.update({
        where: { id },
        data: {
          totalAmount,
          type: dto.type ?? current.type,
          soldAt: dto.soldAt ? new Date(dto.soldAt) : current.soldAt,
          note: dto.note !== undefined ? dto.note : current.note,
          paidAt,
        },
        include: SALE_INCLUDE,
      });
    });
    await this.audit.write({ userId: user.id, companyId, action: 'update_sale', entity: 'Sale', entityId: id });
    return sale;
  }

  async remove(id: string, user: any) {
    const current = await this.get(id, user);
    await this.prisma.$transaction(async (tx) => {
      await this.restoreStock(tx, current.items);
      await tx.sale.delete({ where: { id } });
    });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'delete_sale', entity: 'Sale', entityId: id });
    return { success: true };
  }
}
