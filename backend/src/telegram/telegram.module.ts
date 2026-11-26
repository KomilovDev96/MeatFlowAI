import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ClientOrdersModule } from '../client-orders/client-orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { ReportsModule } from '../reports/reports.module';
import { SalesModule } from '../sales/sales.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AuditModule, SalesModule, PaymentsModule, ReportsModule, ClientOrdersModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
