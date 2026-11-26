import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { ClientOrdersModule } from './client-orders/client-orders.module';
import { ClientsModule } from './clients/clients.module';
import { CompaniesModule } from './companies/companies.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { QueueModule } from './queue/queue.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReportsModule } from './reports/reports.module';
import { SalesModule } from './sales/sales.module';
import { StorageModule } from './storage/storage.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { TelegramModule } from './telegram/telegram.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SuperAdminModule,
    AdminsModule,
    CompaniesModule,
    ClientsModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    AnalyticsModule,
    ReceiptsModule,
    ClientOrdersModule,
    ReportsModule,
    AuditModule,
    TelegramModule,
    StorageModule,
    QueueModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
