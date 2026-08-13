import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'telegram-notifications' }),
    BullModule.registerQueue({ name: 'background-jobs' }),
    BullModule.registerQueue({ name: 'analytics-processing' }),
  ],
  controllers: [QueueController],
})
export class QueueModule {}
