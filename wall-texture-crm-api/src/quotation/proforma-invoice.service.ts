import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, QuotationTemplateCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationPdfService } from './quotation-pdf.service';
import { PaymentService } from './payment.service';
import { CompanyProfileService } from '../settings/company-profile.service';
import { QuotationPdfData } from './templates/quotation-pdf.types';
import { isSecondBrand } from './templates/quotation-templates';
import {
  bankDetailsFromProfile,
  brandCompanyFromProfile,
} from './templates/pdf-data.util';

const QUOTATION_INCLUDE = {
  customer: true,
  template: true,
  items: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
} satisfies Prisma.QuotationInclude;

/** The frozen part of QuotationPdfData a Proforma Invoice snapshots at generation time. */
type Snapshot = Omit<
  QuotationPdfData,
  | 'quotationNumber'
  | 'quotationDate'
  | 'validUntil'
  | 'docLabel'
  | 'numberLabel'
  | 'paymentSummary'
>;

/**
 * Generated from a quotation — freezes items/customer/totals/terms at generation time (an
 * invoice shouldn't silently drift if the quotation is edited afterwards), but the amount
 * received / balance due is always computed live from the existing payments feature, so
 * "amount tracking" stays current without needing its own separate payment log.
 */
@Injectable()
export class ProformaInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationPdfService: QuotationPdfService,
    private readonly paymentService: PaymentService,
    private readonly companyProfile: CompanyProfileService,
  ) {}

  /** PREFIX-YYYY-NNNN: next number after the highest one already used this year. */
  private async generateInvoiceNumber(): Promise<string> {
    const { proformaPrefix } = await this.companyProfile.getProfile();
    const year = new Date().getFullYear();
    const stem = `${proformaPrefix}-${year}-`;
    const last = await this.prisma.proformaInvoice.findFirst({
      where: { invoiceNumber: { startsWith: stem } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
    const lastSeq = last ? parseInt(last.invoiceNumber.slice(stem.length), 10) : 0;
    const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
    return `${stem}${String(next).padStart(4, '0')}`;
  }

  private async findQuotation(quotationId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      include: QUOTATION_INCLUDE,
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async generate(quotationId: string, userId?: string) {
    const quotation = await this.findQuotation(quotationId);
    const profile = await this.companyProfile.getProfile();
    const secondBrand = isSecondBrand(quotation.template.code);
    const logoPath = await this.companyProfile.getLogoFilePath(
      secondBrand ? 'tftLogoUrl' : 'logoUrl',
    );

    const snapshot: Snapshot = {
      company: brandCompanyFromProfile(profile, secondBrand, logoPath),
      bankDetails: bankDetailsFromProfile(profile),
      advanceRequired: Number(quotation.advanceRequired),
      projectName: quotation.projectName,
      version: quotation.version,
      customerName: quotation.customer.customerName,
      companyName: quotation.customer.companyName,
      phone: quotation.customer.phone,
      email: quotation.customer.email,
      address: quotation.customer.address,
      city: quotation.customer.city,
      state: quotation.customer.state,
      pinCode: quotation.customer.pinCode,
      gstNumber: quotation.customer.gstNumber,
      items: quotation.items.map((item) => ({
        srNo: item.srNo,
        productName: item.productName,
        description: item.description,
        measurement: item.measurement,
        sqft: Number(item.sqft),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })),
      subTotal: Number(quotation.subTotal),
      discountType: quotation.discountType,
      discountValue: Number(quotation.discountValue),
      discountAmount: Number(quotation.discountAmount),
      gstEnabled: quotation.gstEnabled,
      gstPercentage: Number(quotation.gstPercentage),
      gstAmount: Number(quotation.gstAmount),
      transportationCharges: Number(quotation.transportationCharges),
      installationCharges: Number(quotation.installationCharges),
      additionalCharges: Number(quotation.additionalCharges),
      grandTotal: Number(quotation.grandTotal),
      termsConditions: quotation.termsConditions,
      notes: quotation.notes,
      signatureUrl: quotation.signatureUrl,
    };

    const invoice = await this.prisma.proformaInvoice.create({
      data: {
        invoiceNumber: await this.generateInvoiceNumber(),
        quotationId,
        templateCode: quotation.template.code,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        createdById: userId,
        updatedById: userId,
      },
    });
    return invoice;
  }

  async listForQuotation(quotationId: string) {
    await this.findQuotation(quotationId);
    return this.prisma.proformaInvoice.findMany({
      where: { quotationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async findOne(id: string) {
    const invoice = await this.prisma.proformaInvoice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!invoice) throw new NotFoundException('Proforma invoice not found');
    return invoice;
  }

  async get(id: string) {
    return this.findOne(id);
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    await this.prisma.proformaInvoice.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: 'Proforma invoice deleted' };
  }

  async generatePdf(id: string): Promise<Buffer> {
    const invoice = await this.findOne(id);
    const snapshot = invoice.snapshot as unknown as Snapshot;
    const { amountReceived, balanceDue } = await this.paymentService.summary(
      invoice.quotationId,
    );

    const data: QuotationPdfData = {
      ...snapshot,
      quotationNumber: invoice.invoiceNumber,
      quotationDate: invoice.createdAt,
      validUntil: null,
      docLabel: 'Proforma Invoice',
      numberLabel: 'Invoice #',
      paymentSummary: { amountReceived, balanceDue },
    };

    return this.quotationPdfService.generate(
      invoice.templateCode as QuotationTemplateCode,
      data,
    );
  }
}
