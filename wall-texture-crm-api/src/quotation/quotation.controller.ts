import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { QuotationTemplateCode } from '@prisma/client';
import type { Response } from 'express';
import { QuotationService } from './quotation.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { RejectQuotationDto } from './dto/reject-quotation.dto';
import { SwitchTemplateDto } from './dto/switch-template.dto';
import { ConvertToProjectDto } from './dto/convert-to-project.dto';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('templates')
  @ApiOperation({
    summary:
      'List available quotation templates (Classic, Artique Surface, Modern Minimal, Luxury Texture)',
  })
  listTemplates() {
    return this.prisma.quotationTemplate.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new quotation (defaults to DRAFT status)',
  })
  create(@Body() dto: CreateQuotationDto, @CurrentUser('id') userId: string) {
    return this.quotationService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List quotations with search, filter & pagination' })
  findAll(@Query() query: QueryQuotationDto) {
    return this.quotationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single quotation with items' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a quotation (creates a revision snapshot, bumps version)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a quotation' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.remove(id, userId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a quotation as a new draft' })
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.duplicate(id, userId);
  }

  @Patch(':id/template')
  @ApiOperation({
    summary:
      'Switch the quotation template (Classic / Artique Surface / Modern Minimal / Luxury Texture)',
  })
  switchTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SwitchTemplateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.switchTemplate(id, dto, userId);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Mark a draft quotation as sent to the customer' })
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.send(id, userId);
  }

  @Post(':id/viewed')
  @ApiOperation({ summary: 'Mark a sent quotation as viewed by the customer' })
  markViewed(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.markViewed(id, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a quotation' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.approve(id, userId);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a quotation' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectQuotationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.reject(id, dto, userId);
  }

  @Post(':id/convert-to-project')
  @ApiOperation({
    summary: 'Convert an approved quotation into a tracked project',
  })
  convertToProject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToProjectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.convertToProject(id, dto, userId);
  }

  @Get(':id/payments')
  @ApiOperation({
    summary: 'Payment summary (total, advance, received, balance) + history',
  })
  payments(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentService.summary(id);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a payment against the quotation' })
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.create(id, dto, userId);
  }

  @Patch(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Edit a payment' })
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.update(id, paymentId, dto, userId);
  }

  @Delete(':id/payments/:paymentId')
  @ApiOperation({ summary: 'Delete a payment' })
  removePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.remove(id, paymentId, userId);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'List revision/version history for a quotation' })
  listRevisions(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationService.listRevisions(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate/preview/download the quotation PDF' })
  @ApiQuery({ name: 'template', enum: QuotationTemplateCode, required: false })
  @ApiQuery({
    name: 'disposition',
    enum: ['inline', 'attachment'],
    required: false,
  })
  async getPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
    @Query('template') template?: QuotationTemplateCode,
    @Query('disposition') disposition: 'inline' | 'attachment' = 'inline',
  ) {
    const buffer = await this.quotationService.generatePdf(id, template);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename=quotation-${id}.pdf`,
    });
    res.send(buffer);
  }
}
