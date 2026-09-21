import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../shared/services/pdf.service';

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  async monthlySales(months = 12) {
    const since = monthsAgo(months - 1);
    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; total: unknown; count: bigint | number }>
    >(
      Prisma.sql`
        SELECT DATE_FORMAT(approvedAt, '%Y-%m') as month, SUM(grandTotal) as total, COUNT(*) as count
        FROM quotations
        WHERE deletedAt IS NULL AND status IN ('APPROVED','CONVERTED') AND approvedAt >= ${since}
        GROUP BY month ORDER BY month ASC
      `,
    );
    return rows.map((r) => ({
      month: r.month,
      total: Number(r.total ?? 0),
      count: Number(r.count),
    }));
  }

  async revenueTrends(months = 12) {
    const since = monthsAgo(months - 1);
    const rows = await this.prisma.$queryRaw<
      Array<{ month: string; total: unknown }>
    >(Prisma.sql`
      SELECT DATE_FORMAT(approvedAt, '%Y-%m') as month, SUM(grandTotal) as total
      FROM quotations
      WHERE deletedAt IS NULL AND status IN ('APPROVED','CONVERTED') AND approvedAt >= ${since}
      GROUP BY month ORDER BY month ASC
    `);

    const series = rows.map((r) => ({
      month: r.month,
      total: Number(r.total ?? 0),
    }));
    let cumulative = 0;
    return series.map((r) => {
      cumulative += r.total;
      return { ...r, cumulative };
    });
  }

  /**
   * Business overview: quotation + project value, expenses, profit, payments.
   * "Project value" = grand total of quotations that became (non-cancelled) projects;
   * "estimated profit" = project value - recorded expenses.
   */
  async businessSummary() {
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const [
      quotationAgg,
      approvedCount,
      projects,
      expenseAgg,
      expensesByCategory,
      paymentAgg,
      projectStatus,
    ] = await Promise.all([
      this.prisma.quotation.aggregate({
        where: { deletedAt: null },
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.quotation.count({
        where: { deletedAt: null, status: { in: ['APPROVED', 'CONVERTED'] } },
      }),
      this.prisma.projectTracking.findMany({
        where: { deletedAt: null, status: { not: 'CANCELLED' } },
        select: {
          id: true,
          status: true,
          quotation: { select: { id: true, grandTotal: true } },
        },
      }),
      this.prisma.projectExpense.aggregate({
        where: { deletedAt: null, project: { deletedAt: null, status: { not: 'CANCELLED' } } },
        _sum: { amount: true },
      }),
      this.prisma.projectExpense.groupBy({
        by: ['category'],
        where: { deletedAt: null, project: { deletedAt: null, status: { not: 'CANCELLED' } } },
        _sum: { amount: true },
      }),
      this.prisma.projectPayment.groupBy({
        by: ['quotationId'],
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
      this.prisma.projectTracking.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const received = new Map(
      paymentAgg.map((p) => [p.quotationId, Number(p._sum.amount ?? 0)]),
    );
    const projectValue = round2(
      projects.reduce((s, p) => s + Number(p.quotation.grandTotal), 0),
    );
    const totalExpenses = round2(Number(expenseAgg._sum.amount ?? 0));
    const estimatedProfit = round2(projectValue - totalExpenses);

    // Money still to collect on everything that was approved / converted.
    const approvedQuotations = await this.prisma.quotation.findMany({
      where: { deletedAt: null, status: { in: ['APPROVED', 'CONVERTED'] } },
      select: { id: true, grandTotal: true },
    });
    const pendingPayments = round2(
      approvedQuotations.reduce(
        (s, q) => s + Math.max(Number(q.grandTotal) - (received.get(q.id) ?? 0), 0),
        0,
      ),
    );
    const totalReceived = round2(
      [...received.values()].reduce((s, n) => s + n, 0),
    );

    const count = (st: string) =>
      projectStatus.find((r) => r.status === st)?._count._all ?? 0;

    return {
      totalQuotations: quotationAgg._count._all,
      approvedQuotations: approvedCount,
      totalQuotationValue: round2(Number(quotationAgg._sum.grandTotal ?? 0)),
      totalProjectValue: projectValue,
      totalExpenses,
      estimatedProfit,
      profitMargin: projectValue > 0 ? round2((estimatedProfit / projectValue) * 100) : 0,
      activeProjects: count('STARTED') + count('IN_PROGRESS') + count('ON_HOLD') + count('PENDING'),
      completedProjects: count('COMPLETED'),
      totalReceived,
      pendingPayments,
      expensesByCategory: expensesByCategory.map((r) => ({
        category: r.category,
        total: round2(Number(r._sum.amount ?? 0)),
      })),
      projectStatusSummary: projectStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
    };
  }

  async leadConversion() {
    const rows = await this.prisma.customer.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    const won = rows.find((r) => r.status === 'WON')?._count._all ?? 0;

    return {
      byStatus: rows.map((r) => ({ status: r.status, count: r._count._all })),
      total,
      won,
      conversionRate: total > 0 ? Number(((won / total) * 100).toFixed(2)) : 0,
    };
  }

  async quotationPerformance() {
    const rows = await this.prisma.quotation.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { grandTotal: true },
    });
    const total = rows.reduce((sum, r) => sum + r._count._all, 0);
    const approved =
      rows.find((r) => r.status === 'APPROVED' || r.status === 'CONVERTED')
        ?._count._all ?? 0;

    const avgTurnaround = await this.prisma.$queryRaw<
      Array<{ avgDays: number | null }>
    >(Prisma.sql`
      SELECT AVG(DATEDIFF(approvedAt, quotationDate)) as avgDays
      FROM quotations
      WHERE deletedAt IS NULL AND approvedAt IS NOT NULL
    `);

    return {
      byStatus: rows.map((r) => ({
        status: r.status,
        count: r._count._all,
        totalValue: Number(r._sum.grandTotal ?? 0),
      })),
      total,
      approvalRate:
        total > 0 ? Number(((approved / total) * 100).toFixed(2)) : 0,
      avgApprovalTurnaroundDays: Number(avgTurnaround[0]?.avgDays ?? 0),
    };
  }

  async mostRequestedTexture(limit = 10) {
    const rows = await this.prisma.quotationItem.groupBy({
      by: ['productName'],
      where: { deletedAt: null, quotation: { deletedAt: null } },
      _count: { _all: true },
      _sum: { sqft: true },
      orderBy: { _count: { productName: 'desc' } },
      take: limit,
    });

    return rows.map((r) => ({
      productName: r.productName,
      timesQuoted: r._count._all,
      totalSqft: Number(r._sum.sqft ?? 0),
    }));
  }

  async projectProgress() {
    const projects = await this.prisma.projectTracking.findMany({
      where: { deletedAt: null, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      select: {
        id: true,
        projectName: true,
        status: true,
        progressPercentage: true,
        expectedCompletionDate: true,
        customer: { select: { customerName: true } },
      },
      orderBy: { progressPercentage: 'asc' },
    });

    const byStatus = await this.prisma.projectTracking.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
      _avg: { progressPercentage: true },
    });

    return {
      projects,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        avgProgress: Number((r._avg.progressPercentage ?? 0).toFixed(1)),
      })),
    };
  }

  async whatsappStatistics() {
    const [byStatus, byType, byDirection, total] = await Promise.all([
      this.prisma.whatsAppMessage.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.whatsAppMessage.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.whatsAppMessage.groupBy({
        by: ['direction'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.whatsAppMessage.count({ where: { deletedAt: null } }),
    ]);

    const failed =
      byStatus.find((r) => r.status === 'FAILED')?._count._all ?? 0;
    const sentCount = byStatus
      .filter((r) => ['SENT', 'DELIVERED', 'READ'].includes(r.status))
      .reduce((sum, r) => sum + r._count._all, 0);

    return {
      total,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      byType: byType.map((r) => ({ type: r.type, count: r._count._all })),
      byDirection: byDirection.map((r) => ({
        direction: r.direction,
        count: r._count._all,
      })),
      deliveryRate:
        total > 0 ? Number(((sentCount / total) * 100).toFixed(2)) : 0,
      failed,
    };
  }

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------

  async exportExcel(): Promise<Buffer> {
    const [sales, conversion, performance, textures] = await Promise.all([
      this.monthlySales(12),
      this.leadConversion(),
      this.quotationPerformance(),
      this.mostRequestedTexture(20),
    ]);

    const workbook = new (await import('exceljs')).Workbook();
    workbook.creator = 'Wall Texture CRM';

    const salesSheet = workbook.addWorksheet('Monthly Sales');
    salesSheet.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Revenue', key: 'total', width: 15 },
      { header: 'Quotations', key: 'count', width: 15 },
    ];
    salesSheet.addRows(sales);

    const conversionSheet = workbook.addWorksheet('Lead Conversion');
    conversionSheet.columns = [
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Count', key: 'count', width: 15 },
    ];
    conversionSheet.addRows(conversion.byStatus);

    const performanceSheet = workbook.addWorksheet('Quotation Performance');
    performanceSheet.columns = [
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 18 },
    ];
    performanceSheet.addRows(performance.byStatus);

    const textureSheet = workbook.addWorksheet('Most Requested Texture');
    textureSheet.columns = [
      { header: 'Product / Texture', key: 'productName', width: 30 },
      { header: 'Times Quoted', key: 'timesQuoted', width: 15 },
      { header: 'Total Sq.ft', key: 'totalSqft', width: 15 },
    ];
    textureSheet.addRows(textures);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(): Promise<Buffer> {
    const [sales, conversion, performance, textures] = await Promise.all([
      this.monthlySales(12),
      this.leadConversion(),
      this.quotationPerformance(),
      this.mostRequestedTexture(10),
    ]);

    return this.pdfService.generateBuffer({
      content: [
        { text: 'Analytics Report', style: 'header' },
        {
          text: `Generated on ${new Date().toLocaleString()}`,
          fontSize: 9,
          color: '#6b7280',
          margin: [0, 0, 0, 16],
        },

        { text: 'Monthly Sales', style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Month', 'Revenue', 'Quotations'].map((h) => ({
                text: h,
                bold: true,
                fillColor: '#e5e7eb',
              })),
              ...sales.map((s) => [
                s.month,
                `Rs. ${s.total.toLocaleString('en-IN')}`,
                String(s.count),
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 4, 0, 16],
        },

        {
          text: `Lead Conversion Rate: ${conversion.conversionRate}% (${conversion.won}/${conversion.total})`,
          style: 'subheader',
        },
        {
          text: `Quotation Approval Rate: ${performance.approvalRate}%`,
          margin: [0, 0, 0, 16],
        },

        { text: 'Most Requested Texture', style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              ['Product', 'Times Quoted', 'Total Sq.ft'].map((h) => ({
                text: h,
                bold: true,
                fillColor: '#e5e7eb',
              })),
              ...textures.map((t) => [
                t.productName,
                String(t.timesQuoted),
                t.totalSqft.toFixed(2),
              ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        header: { fontSize: 16, bold: true },
        subheader: { fontSize: 12, bold: true, margin: [0, 8, 0, 4] },
      },
    });
  }
}
