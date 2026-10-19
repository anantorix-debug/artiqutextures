import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { PaymentService } from './payment.service';
import { ProformaInvoiceService } from './proforma-invoice.service';
import { ProformaInvoiceController } from './proforma-invoice.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [QuotationController, ProformaInvoiceController],
  providers: [
    QuotationService,
    QuotationPdfService,
    PaymentService,
    ProformaInvoiceService,
  ],
  exports: [QuotationService, QuotationPdfService, PaymentService],
})
export class QuotationModule {}
