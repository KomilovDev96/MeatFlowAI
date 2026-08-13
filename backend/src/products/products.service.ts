import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private companyScope(user: any) {
    if (user.role !== Role.ADMIN || !user.companyId) throw new ForbiddenException('Admin company scope required');
    return user.companyId;
  }

  create(dto: CreateProductDto, user: any) {
    const companyId = this.companyScope(user);
    return this.prisma.product.create({ data: { ...dto, companyId } }).then(async (product) => {
      await this.audit.write({ userId: user.id, companyId, action: 'create_product', entity: 'Product', entityId: product.id });
      return product;
    });
  }

  list(user: any) {
    if (user.role === Role.SUPER_ADMIN) return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return this.prisma.product.findMany({ where: { companyId: this.companyScope(user) }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: string, user: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (user.role !== Role.SUPER_ADMIN && product.companyId !== this.companyScope(user)) throw new ForbiddenException('Company scope violation');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, user: any) {
    const current = await this.get(id, user);
    const product = await this.prisma.product.update({ where: { id }, data: dto });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'update_product', entity: 'Product', entityId: id });
    return product;
  }

  async remove(id: string, user: any) {
    const current = await this.get(id, user);
    await this.prisma.product.delete({ where: { id } });
    await this.audit.write({ userId: user.id, companyId: current.companyId, action: 'delete_product', entity: 'Product', entityId: id });
    return { success: true };
  }
}
