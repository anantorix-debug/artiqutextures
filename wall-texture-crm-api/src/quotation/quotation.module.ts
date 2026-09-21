import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { PaymentService } from './payment.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [QuotationController],
  providers: [QuotationService, QuotationPdfService, PaymentService],
  exports: [QuotationService, QuotationPdfService, PaymentService],
})
export class QuotationModule {}
