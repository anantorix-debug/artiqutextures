import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, QuotationTemplateCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { QuotationPdfService } from './quotation-pdf.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { RejectQuotationDto } from './dto/reject-quotation.dto';
import { SwitchTemplateDto } from './dto/switch-template.dto';
import { ConvertToProjectDto } from './dto/convert-to-project.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';
import { QuotationPdfData } from './templates/quotation-pdf.types';
import { isSecondBrand } from './templates/quotation-templates';
import { CompanyProfileService } from '../settings/company-profile.service';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface Totals {
  subTotal: number;
  discountAmount: number;
  gstAmount: number;
  grandTotal: number;
  itemAmounts: number[];
}

const QUOTATION_INCLUDE = {
  customer: true,
  template: true,
  items: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
  project: true,
} satisfies Prisma.QuotationInclude;

@Injectable()
export class QuotationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly quotationPdfService: QuotationPdfService,
    private readonly companyProfile: CompanyProfileService,
  ) {}

  private calculateTotals(
    items: QuotationItemDto[],
    discountType: 'PERCENTAGE' | 'FIXED',
    discountValue: number,
    gstEnabled: boolean,
    gstPercentage: number,
    transportationCharges: number,
    installationCharges: number,
    additionalCharges: number,
  ): Totals {
    const itemAmounts = items.map((item) => round2(item.sqft * item.rate));
    const subTotal = round2(
      itemAmounts.reduce((sum, amount) => sum + amount, 0),
    );

    const discountAmount = round2(
      discountType === 'PERCENTAGE'
        ? (subTotal * discountValue) / 100
        : discountValue,
    );
    const afterDiscount = subTotal - discountAmount;
    const gstAmount = round2(
      gstEnabled ? (afterDiscount * gstPercentage) / 100 : 0,
    );
    const grandTotal = round2(
      afterDiscount +
        gstAmount +
        transportationCharges +
        installationCharges +
        additionalCharges,
    );

    return { subTotal, discountAmount, gstAmount, grandTotal, itemAmounts };
  }

  /** PREFIX-YYYY-NNNN: next number after the highest one already used this year (safe after deletions). */
  private async generateQuotationNumber(): Promise<string> {
    const { quotationPrefix } = await this.companyProfile.getProfile();
    const year = new Date().getFullYear();
    const stem = `${quotationPrefix}-${year}-`;
    const last = await this.prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: stem } },
      orderBy: { quotationNumber: 'desc' },
      select: { quotationNumber: true },
    });
    const lastSeq = last
      ? parseInt(last.quotationNumber.slice(stem.length), 10)
      : 0;
    const next = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
    return `${stem}${String(next).padStart(4, '0')}`;
  }

  /** SENT/VIEWED quotations past their validity date become EXPIRED (evaluated lazily on read). */
  private async expireOverdue() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    await this.prisma.quotation.updateMany({
      where: {
        deletedAt: null,
        status: { in: ['SENT', 'VIEWED'] },
        validUntil: { lt: startOfToday },
      },
      data: { status: 'EXPIRED' },
    });
  }

  private async getDefaultTemplateId(
    templateCode?: QuotationTemplateCode,
  ): Promise<string> {
    const template = await this.prisma.quotationTemplate.findFirst({
      where: {
        code: templateCode ?? QuotationTemplateCode.ARTIQUE_SURFACE,
        deletedAt: null,
      },
    });
    if (!template) {
      throw new BadRequestException(
        'Quotation templates are not seeded yet — run `npm run prisma:seed`',
      );
    }
    return template.id;
  }

  async create(dto: CreateQuotationDto, userId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const profile = await this.companyProfile.getProfile();
    const templateId = await this.getDefaultTemplateId(
      dto.templateCode ??
        (profile.defaultTemplateCode as QuotationTemplateCode),
    );
    const discountType = dto.discountType ?? 'PERCENTAGE';
    const totals = this.calculateTotals(
      dto.items,
      discountType,
      dto.discountValue ?? 0,
      dto.gstEnabled ?? false,
      dto.gstPercentage ?? 0,
      dto.transportationCharges ?? 0,
      dto.installationCharges ?? 0,
      dto.additionalCharges ?? 0,
    );

    const quotationDate = dto.quotationDate
      ? new Date(dto.quotationDate)
      : new Date();
    const validUntil = dto.validUntil
      ? new Date(dto.validUntil)
      : new Date(
          quotationDate.getTime() + profile.defaultValidityDays * 86400000,
        );
    const advanceRequired =
      dto.advanceRequired ??
      round2((totals.grandTotal * profile.defaultAdvancePercent) / 100);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber: await this.generateQuotationNumber(),
        customerId: dto.customerId,
        projectName: dto.projectName,
        templateId,
        quotationDate,
        validUntil,
        advanceRequired: Math.min(advanceRequired, totals.grandTotal),
        subTotal: totals.subTotal,
        discountType,
        discountValue: dto.discountValue ?? 0,
        discountAmount: totals.discountAmount,
        gstEnabled: dto.gstEnabled ?? false,
        gstPercentage: dto.gstPercentage ?? 0,
        gstAmount: totals.gstAmount,
        transportationCharges: dto.transportationCharges ?? 0,
        installationCharges: dto.installationCharges ?? 0,
        additionalCharges: dto.additionalCharges ?? 0,
        grandTotal: totals.grandTotal,
        termsConditions: dto.termsConditions ?? profile.defaultTerms,
        notes: dto.notes ?? (profile.defaultNotes || undefined),
        createdById: userId,
        updatedById: userId,
        items: {
          create: dto.items.map((item, index) => ({
            srNo: index + 1,
            productName: item.productName,
            description: item.description,
            measurement: item.measurement,
            sqft: item.sqft,
            rate: item.rate,
            amount: totals.itemAmounts[index],
            sortOrder: index,
            createdById: userId,
          })),
        },
      },
      include: QUOTATION_INCLUDE,
    });

    await this.prisma.customerActivity.create({
      data: {
        customerId: dto.customerId,
        type: 'QUOTATION',
        title: `Quotation ${quotation.quotationNumber} created`,
        description: `Grand total: ${totals.grandTotal}`,
        createdById: userId,
      },
    });

    await this.auditLogService.log({
      userId,
      action: 'CREATE',
      module: 'quotation',
      entityType: 'Quotation',
      entityId: quotation.id,
      newValues: quotation,
    });

    return quotation;
  }

  async findAll(query: QueryQuotationDto): Promise<Paginated<unknown>> {
    await this.expireOverdue();
    const { page, limit, search, sortBy, sortOrder, status, customerId } =
      query;
    const skip = toSkip(page, limit);

    const where: Prisma.QuotationWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { quotationNumber: { contains: search } },
              { projectName: { contains: search } },
              { customer: { customerName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, customerName: true, phone: true } },
          template: { select: { id: true, name: true, code: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    await this.expireOverdue();
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: QUOTATION_INCLUDE,
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async update(id: string, dto: UpdateQuotationDto, userId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === 'CONVERTED') {
      throw new BadRequestException('Converted quotations cannot be edited');
    }

    // Snapshot the current state as a revision before mutating.
    await this.prisma.quotationRevision.create({
      data: {
        quotationId: id,
        versionNumber: existing.version,
        snapshot: existing,
        changeNote: 'Updated via API',
        createdById: userId,
      },
    });

    const items =
      dto.items ??
      existing.items.map((item) => ({
        productName: item.productName,
        description: item.description ?? undefined,
        measurement: item.measurement ?? undefined,
        sqft: Number(item.sqft),
        rate: Number(item.rate),
      }));

    const discountType = dto.discountType ?? existing.discountType;
    const discountValue = dto.discountValue ?? Number(existing.discountValue);
    const gstEnabled = dto.gstEnabled ?? existing.gstEnabled;
    const gstPercentage = dto.gstPercentage ?? Number(existing.gstPercentage);
    const transportationCharges =
      dto.transportationCharges ?? Number(existing.transportationCharges);
    const installationCharges =
      dto.installationCharges ?? Number(existing.installationCharges);
    const additionalCharges =
      dto.additionalCharges ?? Number(existing.additionalCharges);

    const totals = this.calculateTotals(
      items,
      discountType,
      discountValue,
      gstEnabled,
      gstPercentage,
      transportationCharges,
      installationCharges,
      additionalCharges,
    );

    const templateId = dto.templateCode
      ? await this.getDefaultTemplateId(dto.templateCode)
      : undefined;
    const advanceRequired = Math.min(
      dto.advanceRequired ?? Number(existing.advanceRequired),
      totals.grandTotal,
    );
    // An expired quotation whose validity is extended goes back to "sent".
    const reopen =
      existing.status === 'EXPIRED' &&
      !!dto.validUntil &&
      new Date(dto.validUntil) >= new Date(new Date().setHours(0, 0, 0, 0));

    const quotation = await this.prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      return tx.quotation.update({
        where: { id },
        data: {
          projectName: dto.projectName,
          templateId,
          quotationDate: dto.quotationDate
            ? new Date(dto.quotationDate)
            : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          subTotal: totals.subTotal,
          discountType,
          discountValue,
          discountAmount: totals.discountAmount,
          gstEnabled,
          gstPercentage,
          gstAmount: totals.gstAmount,
          transportationCharges,
          installationCharges,
          additionalCharges,
          grandTotal: totals.grandTotal,
          advanceRequired,
          ...(reopen ? { status: 'SENT' as const } : {}),
          termsConditions: dto.termsConditions,
          notes: dto.notes,
          version: { increment: 1 },
          updatedById: userId,
          items: {
            create: items.map((item, index) => ({
              srNo: index + 1,
              productName: item.productName,
              description: item.description,
              measurement: item.measurement,
              sqft: item.sqft,
              rate: item.rate,
              amount: totals.itemAmounts[index],
              sortOrder: index,
              createdById: userId,
            })),
          },
        },
        include: QUOTATION_INCLUDE,
      });
    });

    await this.auditLogService.log({
      userId,
      action: 'UPDATE',
      module: 'quotation',
      entityType: 'Quotation',
      entityId: id,
      oldValues: existing,
      newValues: quotation,
    });

    return quotation;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === 'CONVERTED') {
      throw new BadRequestException('Converted quotations cannot be deleted');
    }
    await this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.auditLogService.log({
      userId,
      action: 'DELETE',
      module: 'quotation',
      entityType: 'Quotation',
      entityId: id,
    });
    return { message: 'Quotation deleted successfully' };
  }

  async duplicate(id: string, userId?: string) {
    const existing = await this.findOne(id);

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber: await this.generateQuotationNumber(),
        customerId: existing.customerId,
        projectName: `${existing.projectName} (Copy)`,
        templateId: existing.templateId,
        status: 'DRAFT',
        quotationDate: new Date(),
        validUntil: existing.validUntil,
        subTotal: existing.subTotal,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        discountAmount: existing.discountAmount,
        gstEnabled: existing.gstEnabled,
        gstPercentage: existing.gstPercentage,
        gstAmount: existing.gstAmount,
        transportationCharges: existing.transportationCharges,
        installationCharges: existing.installationCharges,
        additionalCharges: existing.additionalCharges,
        grandTotal: existing.grandTotal,
        advanceRequired: existing.advanceRequired,
        termsConditions: existing.termsConditions,
        notes: existing.notes,
        rootQuotationId: existing.rootQuotationId ?? existing.id,
        createdById: userId,
        updatedById: userId,
        items: {
          create: existing.items.map((item) => ({
            srNo: item.srNo,
            productName: item.productName,
            description: item.description,
            measurement: item.measurement,
            sqft: item.sqft,
            rate: item.rate,
            amount: item.amount,
            sortOrder: item.sortOrder,
            createdById: userId,
          })),
        },
      },
      include: QUOTATION_INCLUDE,
    });

    return quotation;
  }

  async switchTemplate(id: string, dto: SwitchTemplateDto, userId?: string) {
    await this.findOne(id);
    const templateId = await this.getDefaultTemplateId(dto.templateCode);
    return this.prisma.quotation.update({
      where: { id },
      data: { templateId, updatedById: userId },
      include: QUOTATION_INCLUDE,
    });
  }

  async send(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Only draft quotations can be sent');
    }
    return this.prisma.quotation.update({
      where: { id },
      data: { status: 'SENT', updatedById: userId },
      include: QUOTATION_INCLUDE,
    });
  }

  /** Customer opened the quotation: SENT -> VIEWED (no-op for any other status). */
  async markViewed(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (existing.status !== 'SENT') return existing;
    return this.prisma.quotation.update({
      where: { id },
      data: { status: 'VIEWED', updatedById: userId },
      include: QUOTATION_INCLUDE,
    });
  }

  async approve(id: string, userId?: string) {
    const existing = await this.findOne(id);
    if (!['SENT', 'VIEWED', 'DRAFT'].includes(existing.status)) {
      throw new BadRequestException(
        'Only draft, sent or viewed quotations can be approved',
      );
    }
    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        updatedById: userId,
      },
      include: QUOTATION_INCLUDE,
    });

    await this.prisma.customerActivity.create({
      data: {
        customerId: existing.customerId,
        type: 'STATUS_CHANGE',
        title: `Quotation ${existing.quotationNumber} approved`,
        createdById: userId,
      },
    });

    await this.auditLogService.log({
      userId,
      action: 'APPROVE',
      module: 'quotation',
      entityType: 'Quotation',
      entityId: id,
    });

    return quotation;
  }

  async reject(id: string, dto: RejectQuotationDto, userId?: string) {
    const existing = await this.findOne(id);
    if (!['SENT', 'VIEWED', 'DRAFT'].includes(existing.status)) {
      throw new BadRequestException(
        'Only draft, sent or viewed quotations can be rejected',
      );
    }
    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectionReason: dto.rejectionReason,
        updatedById: userId,
      },
      include: QUOTATION_INCLUDE,
    });

    await this.prisma.customerActivity.create({
      data: {
        customerId: existing.customerId,
        type: 'STATUS_CHANGE',
        title: `Quotation ${existing.quotationNumber} rejected`,
        description: dto.rejectionReason,
        createdById: userId,
      },
    });

    await this.auditLogService.log({
      userId,
      action: 'REJECT',
      module: 'quotation',
      entityType: 'Quotation',
      entityId: id,
      description: dto.rejectionReason,
    });

    return quotation;
  }

  async convertToProject(
    id: string,
    dto: ConvertToProjectDto,
    userId?: string,
  ) {
    const existing = await this.findOne(id);
    if (existing.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only approved quotations can be converted to a project',
      );
    }
    if (existing.project) {
      throw new BadRequestException(
        'This quotation has already been converted to a project',
      );
    }

    const [quotation, project] = await this.prisma.$transaction([
      this.prisma.quotation.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedToProjectAt: new Date(),
          updatedById: userId,
        },
      }),
      this.prisma.projectTracking.create({
        data: {
          projectName: existing.projectName,
          customerId: existing.customerId,
          quotationId: existing.id,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          expectedCompletionDate: dto.expectedCompletionDate
            ? new Date(dto.expectedCompletionDate)
            : undefined,
          assignedTeam: dto.assignedTeam,
          status: 'PENDING',
          createdById: userId,
          updatedById: userId,
        },
      }),
    ]);

    // Payments recorded against the quotation before it became a project now belong to it too.
    await this.prisma.projectPayment.updateMany({
      where: { quotationId: id, projectId: null },
      data: { projectId: project.id },
    });
    await this.prisma.projectActivity.create({
      data: {
        projectId: project.id,
        type: 'PROJECT_CREATED',
        title: `Project created from quotation ${existing.quotationNumber}`,
        createdById: userId,
      },
    });

    await this.prisma.customerActivity.create({
      data: {
        customerId: existing.customerId,
        type: 'STATUS_CHANGE',
        title: `Quotation ${existing.quotationNumber} converted to project`,
        createdById: userId,
      },
    });

    return { quotation, project };
  }

  async listRevisions(id: string) {
    await this.findOne(id);
    return this.prisma.quotationRevision.findMany({
      where: { quotationId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------
  // PDF
  // ---------------------------------------------------------------------

  async generatePdf(
    id: string,
    templateOverride?: QuotationTemplateCode,
  ): Promise<Buffer> {
    const quotation = await this.findOne(id);
    const templateCode = templateOverride ?? quotation.template.code;
    const profile = await this.companyProfile.getProfile();
    // "Time For Texture" is a separate brand/company with its own details and logo.
    const secondBrand = isSecondBrand(templateCode);
    const logoPath = await this.companyProfile.getLogoFilePath(
      secondBrand ? 'tftLogoUrl' : 'logoUrl',
    );

    const data: QuotationPdfData = {
      company: secondBrand
        ? {
            name: profile.tftName,
            tagline: profile.tftTagline,
            address: profile.tftAddress,
            phone: profile.tftPhone,
            email: profile.tftEmail,
            website: profile.tftWebsite,
            gstNumber: profile.tftGstNumber,
            logoPath: logoPath ?? null,
          }
        : {
            name: profile.companyName,
            tagline: profile.tagline,
            address: profile.address,
            phone: profile.phone,
            email: profile.email,
            website: profile.website,
            gstNumber: profile.gstNumber,
            logoPath: logoPath ?? null,
          },
      advanceRequired: Number(quotation.advanceRequired),
      quotationNumber: quotation.quotationNumber,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
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

    return this.quotationPdfService.generate(templateCode, data);
  }
}
