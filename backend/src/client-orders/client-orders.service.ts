import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, ProductUnit, Role, SaleType, Status } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { SalesService } from '../sales/sales.service';

const ORDER_INCLUDE = {
  client: { select: { id: true, firstName: true, lastName: true, phone: true, telegramId: true } },
  items: { include: { product: { select: { id: true, name: true, unit: true, salePrice: true } } } },
} as const;

export type ClientOrderFull = Prisma.ClientOrderGetPayload<{ include: typeof ORDER_INCLUDE }>;
export type OrderListener = (order: ClientOrderFull) => void | Promise<void>;

@Injectable()
export class ClientOrdersService {
  private readonly createdListeners: OrderListener[] = [];
  private readonly decidedListeners: OrderListener[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sales: SalesService,
  ) {}

  /** Lets the Telegram bot subscribe without a circular module dependency. */
  onCreated(listener: OrderListener) {
    this.createdListeners.push(listener);
  }
  onDecided(listener: OrderListener) {
    this.decidedListeners.push(listener);
  }

  private async emit(listeners: OrderListener[], order: ClientOrderFull) {
    for (const listener of listeners) {
      try {
        await listener(order);
      } catch {
        // a failed notification must never break the order itself
      }
    }
  }

  private adminScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId as string;
  }

  /** Products a client may order: active and in stock. */
  availableProducts(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, status: Status.ACTIVE, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    });
  }

  async create(clientId: string, companyId: string, items: { productId: string; quantity: number }[], note?: string) {
    if (items.length === 0) throw new BadRequestException('Buyurtma bo‘sh');
    const merged = new Map<string, number>();
    for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);

    const products = await this.prisma.product.findMany({ where: { id: { in: [...merged.keys()] }, companyId, status: Status.ACTIVE } });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const [productId, quantity] of merged) {
      const product = byId.get(productId);
      if (!product) throw new NotFoundException('Product not found');
      if (!(quantity > 0)) throw new BadRequestException('Miqdor noto‘g‘ri');
      if (product.stock.lessThan(quantity)) throw new BadRequestException(`Omborda yetarli emas: ${product.name}`);
    }

    const order = await this.prisma.clientOrder.create({
      data: {
        companyId,
        clientId,
        note,
        items: { create: [...merged].map(([productId, quantity]) => ({ productId, quantity: new Prisma.Decimal(quantity) })) },
      },
      include: ORDER_INCLUDE,
    });
    await this.audit.write({ userId: null, companyId, action: 'create_client_order', entity: 'ClientOrder', entityId: order.id });
    await this.emit(this.createdListeners, order);
    return order;
  }

  list(user: any, status?: OrderStatus) {
    return this.prisma.clientOrder.findMany({
      where: { companyId: this.adminScope(user), ...(status ? { status } : {}) },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async load(id: string, companyId: string) {
    const order = await this.prisma.clientOrder.findUnique({ where: { id }, include: ORDER_INCLUDE });
    if (!order || order.companyId !== companyId) throw new NotFoundException('Order not found');
    return order;
  }

  /** Confirming turns the order into a real sale: stock is deducted and profit/debt are tracked as usual. */
  async confirm(id: string, user: any) {
    const companyId = this.adminScope(user);
    const order = await this.load(id, companyId);

    // claim the order first so two admins cannot confirm it twice
    const claimed = await this.prisma.clientOrder.updateMany({
      where: { id, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CONFIRMED, decidedById: user.id, decidedAt: new Date() },
    });
    if (claimed.count === 0) throw new BadRequestException('Buyurtma allaqachon ko‘rib chiqilgan');

    try {
      const sale = await this.sales.create(
        {
          clientId: order.clientId,
          type: SaleType.CONSIGNMENT,
          note: `Telegram buyurtma №${order.number}`,
          items: order.items.map((item) => {
            const quantity = Number(item.quantity);
            // pieces-priced products are sold at salePrice per piece, so the same number is used as "kg" for pricing
            return { productId: item.productId, quantityPieces: item.product.unit === ProductUnit.PIECE ? quantity : 0, quantityKg: quantity };
          }),
        },
        user,
      );
      await this.prisma.clientOrder.update({ where: { id }, data: { saleId: sale.id } });
    } catch (error) {
      await this.prisma.clientOrder.update({ where: { id }, data: { status: OrderStatus.PENDING, decidedById: null, decidedAt: null } });
      throw error;
    }

    await this.audit.write({ userId: user.id, companyId, action: 'confirm_client_order', entity: 'ClientOrder', entityId: id });
    const done = await this.load(id, companyId);
    await this.emit(this.decidedListeners, done);
    return done;
  }

  async reject(id: string, user: any) {
    const companyId = this.adminScope(user);
    await this.load(id, companyId);
    const claimed = await this.prisma.clientOrder.updateMany({
      where: { id, status: OrderStatus.PENDING },
      data: { status: OrderStatus.REJECTED, decidedById: user.id, decidedAt: new Date() },
    });
    if (claimed.count === 0) throw new BadRequestException('Buyurtma allaqachon ko‘rib chiqilgan');
    await this.audit.write({ userId: user.id, companyId, action: 'reject_client_order', entity: 'ClientOrder', entityId: id });
    const done = await this.load(id, companyId);
    await this.emit(this.decidedListeners, done);
    return done;
  }
}
