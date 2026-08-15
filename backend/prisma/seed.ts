import { PrismaClient, ProductUnit, Role, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const superAdmin = await prisma.user.upsert({
    where: { login: 'superadmin' },
    update: {},
    create: {
      role: Role.SUPER_ADMIN,
      firstName: 'MeatFlow',
      lastName: 'Super Admin',
      login: 'superadmin',
      passwordHash,
      status: Status.ACTIVE,
    },
  });

  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'Demo Meat Company',
      phone: '+998901112233',
      address: 'Tashkent',
      latitude: 41.311081,
      longitude: 69.240562,
      description: 'Local demo company',
      currency: 'UZS',
      measurementUnit: ProductUnit.KG,
    },
  });

  await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      role: Role.ADMIN,
      firstName: 'Demo',
      lastName: 'Admin',
      login: 'admin',
      passwordHash,
      phone: '+998909998877',
      companyId: company.id,
    },
  });

  await prisma.client.createMany({
    data: [
      { companyId: company.id, firstName: 'Ali', lastName: 'Karimov', phone: '+998901010101' },
      { companyId: company.id, firstName: 'Vali', lastName: 'Nazarov', phone: '+998902020202' },
    ],
    skipDuplicates: true,
  });

  await prisma.product.createMany({
    data: [
      { companyId: company.id, name: 'Beef', category: 'Meat', unit: ProductUnit.KG, purchasePrice: 60000, salePrice: 72000, stock: 120 },
      { companyId: company.id, name: 'Sausage', category: 'Prepared', unit: ProductUnit.PIECE, purchasePrice: 18000, salePrice: 25000, stock: 80 },
    ],
  });

  await prisma.auditLog.create({
    data: { userId: superAdmin.id, action: 'seed', entity: 'System', metadata: { login: 'superadmin' } },
  });
}

main().finally(async () => prisma.$disconnect());
