import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import { ExcelService } from '../shared/services/excel.service';
import { PdfService } from '../shared/services/pdf.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly excelService: ExcelService,
    private readonly pdfService: PdfService,
  ) {}

  async create(dto: CreateCustomerDto, userId?: string) {
    const customer = await this.prisma.customer.create({
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        siteVisitDate: dto.siteVisitDate
          ? new Date(dto.siteVisitDate)
          : undefined,
        createdById: userId,
        updatedById: userId,
        activities: {
          create: {
            type: 'STATUS_CHANGE',
            title: 'Lead created',
            description: `Lead created with status ${dto.status ?? 'NEW'}`,
            createdById: userId,
          },
        },
      },
    });

    await this.auditLogService.log({
      userId,
      action: 'CREATE',
      module: 'customer',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: customer,
    });

    return customer;
  }

  async findAll(query: QueryCustomerDto): Promise<Paginated<unknown>> {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      status,
      priority,
      leadSource,
      city,
      pendingFollowUp,
    } = query;
    const skip = toSkip(page, limit);

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(leadSource ? { leadSource } : {}),
      ...(city ? { city: { contains: city } } : {}),
      ...(pendingFollowUp === 'true'
        ? {
            followUpDate: { lte: new Date() },
            status: { notIn: ['WON', 'LOST'] },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search } },
              { companyName: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
              { city: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { quotations: true, projects: true, activities: true },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { quotations: true, projects: true, activities: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getProfile(id: string) {
    const customer = await this.findOne(id);

    const [activities, quotations, projects, whatsappMessages] =
      await Promise.all([
        this.prisma.customerActivity.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { activityDate: 'desc' },
        }),
        this.prisma.quotation.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: { template: true, items: true },
        }),
        this.prisma.projectTracking.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.whatsAppMessage.findMany({
          where: { customerId: id, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
      ]);

    return { customer, activities, quotations, projects, whatsappMessages };
  }

  async update(id: string, dto: UpdateCustomerDto, userId?: string) {
    const existing = await this.findOne(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        siteVisitDate: dto.siteVisitDate
          ? new Date(dto.siteVisitDate)
          : undefined,
        updatedById: userId,
      },
    });

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.customerActivity.create({
        data: {
          customerId: id,
          type: 'STATUS_CHANGE',
          title: `Status changed to ${dto.status}`,
          description: `Status changed from ${existing.status} to ${dto.status}`,
          createdById: userId,
        },
      });
    }

    await this.auditLogService.log({
      userId,
      action: 'UPDATE',
      module: 'customer',
      entityType: 'Customer',
      entityId: id,
      oldValues: existing,
      newValues: customer,
    });

    return customer;
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.auditLogService.log({
      userId,
      action: 'DELETE',
      module: 'customer',
      entityType: 'Customer',
      entityId: id,
    });
    return { message: 'Customer deleted successfully' };
  }

  // ---------------------------------------------------------------------
  // Activity Timeline
  // ---------------------------------------------------------------------

  async listActivities(customerId: string) {
    await this.findOne(customerId);
    return this.prisma.customerActivity.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { activityDate: 'desc' },
    });
  }

  async addActivity(
    customerId: string,
    dto: CreateActivityDto,
    userId?: string,
  ) {
    await this.findOne(customerId);
    return this.prisma.customerActivity.create({
      data: {
        customerId,
        type: dto.type ?? 'NOTE',
        title: dto.title,
        description: dto.description,
        activityDate: dto.activityDate
          ? new Date(dto.activityDate)
          : new Date(),
        createdById: userId,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------

  async exportExcel(query: QueryCustomerDto): Promise<Buffer> {
    const { items } = await this.findAll({ ...query, page: 1, limit: 10000 });
    const rows = (items as Array<Record<string, unknown>>).map((c) => ({
      customerName: c.customerName,
      companyName: c.companyName ?? '',
      phone: c.phone,
      email: c.email ?? '',
      city: c.city ?? '',
      state: c.state ?? '',
      leadSource: c.leadSource,
      status: c.status,
      priority: c.priority,
      followUpDate: c.followUpDate
        ? new Date(c.followUpDate as string).toLocaleDateString()
        : '',
      siteVisitDate: c.siteVisitDate
        ? new Date(c.siteVisitDate as string).toLocaleDateString()
        : '',
      createdAt: new Date(c.createdAt as string).toLocaleDateString(),
    }));

    return this.excelService.buildWorkbookBuffer(
      'Leads',
      [
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Company', key: 'companyName', width: 25 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'State', key: 'state', width: 15 },
        { header: 'Lead Source', key: 'leadSource', width: 18 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Follow-up Date', key: 'followUpDate', width: 15 },
        { header: 'Site Visit Date', key: 'siteVisitDate', width: 15 },
        { header: 'Created On', key: 'createdAt', width: 15 },
      ],
      rows,
    );
  }

  async exportPdf(query: QueryCustomerDto): Promise<Buffer> {
    const { items } = await this.findAll({ ...query, page: 1, limit: 10000 });
    const rows = items as Array<Record<string, unknown>>;

    const body = [
      ['Customer', 'Phone', 'City', 'Status', 'Priority', 'Follow-up'].map(
        (h) => ({
          text: h,
          bold: true,
          fillColor: '#e5e7eb',
        }),
      ),
      ...rows.map((c) => [
        String(c.customerName ?? ''),
        String(c.phone ?? ''),
        String(c.city ?? ''),
        String(c.status ?? ''),
        String(c.priority ?? ''),
        c.followUpDate
          ? new Date(c.followUpDate as string).toLocaleDateString()
          : '-',
      ]),
    ];

    return this.pdfService.generateBuffer({
      content: [
        { text: 'Leads Report', style: 'header' },
        {
          text: `Generated on ${new Date().toLocaleString()}`,
          margin: [0, 0, 0, 10],
          fontSize: 9,
          color: '#6b7280',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body,
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: { header: { fontSize: 16, bold: true, margin: [0, 0, 0, 6] } },
    });
  }
}
