import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ProformaInvoiceService } from './proforma-invoice.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Proforma Invoices')
@ApiBearerAuth()
@Controller()
export class ProformaInvoiceController {
  constructor(private readonly proformaInvoiceService: ProformaInvoiceService) {}

  @Post('quotations/:id/proforma-invoices')
  @ApiOperation({
    summary:
      'Generate a Proforma Invoice from a quotation (freezes items/customer/totals; payment status stays live)',
  })
  generate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proformaInvoiceService.generate(id, userId);
  }

  @Get('quotations/:id/proforma-invoices')
  @ApiOperation({ summary: 'List proforma invoices generated from a quotation' })
  listForQuotation(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformaInvoiceService.listForQuotation(id);
  }

  @Get('proforma-invoices/:id')
  @ApiOperation({ summary: 'Get a single proforma invoice' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.proformaInvoiceService.get(id);
  }

  @Delete('proforma-invoices/:id')
  @ApiOperation({ summary: 'Soft delete a proforma invoice' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.proformaInvoiceService.remove(id, userId);
  }

  @Get('proforma-invoices/:id/pdf')
  @ApiOperation({ summary: 'Generate/preview/download the proforma invoice PDF' })
  @ApiQuery({
    name: 'disposition',
    enum: ['inline', 'attachment'],
    required: false,
  })
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('disposition') disposition: 'inline' | 'attachment' = 'inline',
  ) {
    const buffer = await this.proformaInvoiceService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename=proforma-invoice-${id}.pdf`,
    });
    res.send(buffer);
  }
}
