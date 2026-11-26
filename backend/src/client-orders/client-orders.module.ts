import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SalesModule } from '../sales/sales.module';
import { ClientOrdersController } from './client-orders.controller';
import { ClientOrdersService } from './client-orders.service';

@Module({
  imports: [AuditModule, SalesModule],
  controllers: [ClientOrdersController],
  providers: [ClientOrdersService],
  exports: [ClientOrdersService],
})
export class ClientOrdersModule {}
