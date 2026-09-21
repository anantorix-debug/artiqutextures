import { Injectable } from '@nestjs/common';
import { QuotationTemplateCode } from '@prisma/client';
import { PdfService } from '../shared/services/pdf.service';
import { TEMPLATE_BUILDERS } from './templates/quotation-templates';
import { QuotationPdfData } from './templates/quotation-pdf.types';

/**
 * Maps a QuotationTemplateCode to its layout builder and renders the PDF.
 * Preview, Download, Print and WhatsApp all go through this one seam, so they
 * are guaranteed to show the identical document.
 */
@Injectable()
export class QuotationPdfService {
  constructor(private readonly pdfService: PdfService) {}

  async generate(
    templateCode: QuotationTemplateCode,
    data: QuotationPdfData,
  ): Promise<Buffer> {
    const build =
      TEMPLATE_BUILDERS[templateCode] ?? TEMPLATE_BUILDERS.CLASSIC;
    return this.pdfService.generateBuffer(build(data));
  }
}
