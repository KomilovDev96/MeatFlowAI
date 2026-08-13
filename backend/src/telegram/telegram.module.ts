import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [AuditModule],
  controllers: [TelegramController],
  providers: [TelegramService],
})
export class TelegramModule {}
