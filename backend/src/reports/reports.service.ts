import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, ProductUnit, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ZERO = new Prisma.Decimal(0);

type Row = { sold: Prisma.Decimal; revenue: Prisma.Decimal; cost: Prisma.Decimal; received: Prisma.Decimal; receivedCost: Prisma.Decimal };

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId as string;
  }

  /** Stock, receipts, sales, revenue and profit for [from, to]. Profit = revenue - kg * cost-per-kg at time of sale. */
  async summary(user: any, from?: string, to?: string) {
    const companyId = this.companyScope(user);
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(to);
    const hasRange = Object.keys(range).length > 0;

    const [products, sales, receipts] = await Promise.all([
      this.prisma.product.findMany({ where: { companyId }, orderBy: { name: 'asc' } }),
      this.prisma.sale.findMany({ where: { companyId, ...(hasRange ? { soldAt: range } : {}) }, include: { items: true } }),
      this.prisma.stockReceipt.findMany({ where: { companyId, ...(hasRange ? { receivedAt: range } : {}) } }),
    ]);

    const rows = new Map<string, Row>();
    const row = (id: string) => {
      let r = rows.get(id);
      if (!r) {
        r = { sold: ZERO, revenue: ZERO, cost: ZERO, received: ZERO, receivedCost: ZERO };
        rows.set(id, r);
      }
      return r;
    };
    const unitOf = new Map(products.map((p) => [p.id, p.unit]));

    let revenue = ZERO;
    let cost = ZERO;
    let unpaid = ZERO;
    for (const sale of sales) {
      if (!sale.paidAt) unpaid = unpaid.add(sale.totalAmount);
      for (const item of sale.items) {
        const itemCost = item.quantityKg.mul(item.costPerKg);
        const r = row(item.productId);
        r.sold = r.sold.add(unitOf.get(item.productId) === ProductUnit.PIECE ? item.quantityPieces : item.quantityKg);
        r.revenue = r.revenue.add(item.totalAmount);
        r.cost = r.cost.add(itemCost);
        revenue = revenue.add(item.totalAmount);
        cost = cost.add(itemCost);
      }
    }
    let receivedCost = ZERO;
    for (const rc of receipts) {
      const r = row(rc.productId);
      r.received = r.received.add(rc.quantity);
      r.receivedCost = r.receivedCost.add(rc.totalCost);
      receivedCost = receivedCost.add(rc.totalCost);
    }

    let stockValue = ZERO;
    const items = products.map((p) => {
      const r = rows.get(p.id) ?? { sold: ZERO, revenue: ZERO, cost: ZERO, received: ZERO, receivedCost: ZERO };
      const value = p.stock.mul(p.purchasePrice);
      stockValue = stockValue.add(value);
      return {
        productId: p.id,
        name: p.name,
        unit: p.unit,
        stock: p.stock,
        stockValue: value,
        received: r.received,
        receivedCost: r.receivedCost,
        sold: r.sold,
        revenue: r.revenue,
        cost: r.cost,
        profit: r.revenue.sub(r.cost),
      };
    });

    const profit = revenue.sub(cost);
    return {
      from: from ?? null,
      to: to ?? null,
      totals: {
        salesCount: sales.length,
        receiptsCount: receipts.length,
        revenue,
        cost,
        profit,
        marginPercent: revenue.greaterThan(0) ? profit.div(revenue).mul(100).toDecimalPlaces(1) : ZERO,
        receivedCost,
        stockValue,
        unpaidSales: unpaid,
      },
      items,
    };
  }
}
