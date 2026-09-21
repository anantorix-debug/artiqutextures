import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginationMeta } from '../common/utils/pagination.util';

function startOfDay(d = new Date()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}
function endOfDay(d = new Date()): Date {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
}
function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards() {
    const today = new Date();
    const monthStart = startOfMonth(today);

    const [
      totalLeads,
      todaysLeads,
      pendingFollowUps,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      ongoingProjects,
      completedProjects,
      monthlyRevenueAgg,
      whatsappSession,
      galleryImages,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        },
      }),
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          followUpDate: { lte: endOfDay(today) },
          status: { notIn: ['WON', 'LOST'] },
        },
      }),
      this.prisma.quotation.count({
        where: { deletedAt: null, status: { in: ['DRAFT', 'SENT'] } },
      }),
      this.prisma.quotation.count({
        where: { deletedAt: null, approvedAt: { not: null } },
      }),
      this.prisma.quotation.count({
        where: { deletedAt: null, status: 'REJECTED' },
      }),
      this.prisma.projectTracking.count({
        where: {
          deletedAt: null,
          status: { in: ['PENDING', 'STARTED', 'IN_PROGRESS', 'ON_HOLD'] },
        },
      }),
      this.prisma.projectTracking.count({
        where: { deletedAt: null, status: 'COMPLETED' },
      }),
      this.prisma.quotation.aggregate({
        where: {
          deletedAt: null,
          status: { in: ['APPROVED', 'CONVERTED'] },
          approvedAt: { gte: monthStart },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.whatsAppSession.findFirst({ orderBy: { createdAt: 'asc' } }),
      this.prisma.gallery.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalLeads,
      todaysLeads,
      pendingFollowUps,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      ongoingProjects,
      completedProjects,
      monthlyRevenue: Number(monthlyRevenueAgg._sum.grandTotal ?? 0),
      whatsappStatus: whatsappSession?.status ?? 'DISCONNECTED',
      whatsappConnected: whatsappSession?.isConnected ?? false,
      galleryImages,
    };
  }

  async getCharts() {
    const since = monthsAgo(11);

    const [
      monthlyRevenueRows,
      customerGrowthRows,
      quotationStatusRows,
      projectStatusRows,
      leadStatusRows,
    ] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ month: string; total: Prisma.Decimal | string | null }>
      >(Prisma.sql`
          SELECT DATE_FORMAT(approvedAt, '%Y-%m') as month, SUM(grandTotal) as total
          FROM quotations
          WHERE deletedAt IS NULL AND approvedAt IS NOT NULL AND approvedAt >= ${since}
          GROUP BY month ORDER BY month ASC
        `),
      this.prisma.$queryRaw<
        Array<{ month: string; count: bigint | number }>
      >(Prisma.sql`
          SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
          FROM customers
          WHERE deletedAt IS NULL AND createdAt >= ${since}
          GROUP BY month ORDER BY month ASC
        `),
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.projectTracking.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.customer.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    return {
      monthlyRevenue: monthlyRevenueRows.map((r) => ({
        month: r.month,
        total: Number(r.total ?? 0),
      })),
      customerGrowth: customerGrowthRows.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      quotationStatus: quotationStatusRows.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      projectStatus: projectStatusRows.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
      leadConversion: leadStatusRows.map((r) => ({
        status: r.status,
        count: r._count._all,
      })),
    };
  }

  async getRecentActivities(page = 1, limit = 15) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.customerActivity.findMany({
        where,
        orderBy: { activityDate: 'desc' },
        skip,
        take: limit,
        include: { customer: { select: { id: true, customerName: true } } },
      }),
      this.prisma.customerActivity.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
