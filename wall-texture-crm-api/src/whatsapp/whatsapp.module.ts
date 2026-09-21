import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { WhatsappQueueProcessor } from './whatsapp-queue.processor';
import { QuotationModule } from '../quotation/quotation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WHATSAPP_QUEUE } from './whatsapp-job.interface';

@Module({
  imports: [
    BullModule.registerQueue({ name: WHATSAPP_QUEUE }),
    QuotationModule,
    NotificationsModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappClientService, WhatsappQueueProcessor],
  exports: [WhatsappService],
})
export class WhatsappModule {}
