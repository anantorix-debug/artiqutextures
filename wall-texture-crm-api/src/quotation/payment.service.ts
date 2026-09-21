import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto/payment.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Advance / stage payments. Keyed to the quotation so they exist before a project does. */
@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async summary(quotationId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      select: {
        id: true,
        quotationNumber: true,
        grandTotal: true,
        advanceRequired: true,
        project: { select: { id: true, projectName: true } },
      },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const payments = await this.prisma.projectPayment.findMany({
      where: { quotationId, deletedAt: null },
      orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
    });

    const grandTotal = Number(quotation.grandTotal);
    const advanceRequired = Number(quotation.advanceRequired);
    const amountReceived = round2(
      payments.reduce((sum, p) => sum + Number(p.amount), 0),
    );
    return {
      quotationId,
      quotationNumber: quotation.quotationNumber,
      projectId: quotation.project?.id ?? null,
      grandTotal,
      advanceRequired,
      amountReceived,
      balanceDue: round2(Math.max(grandTotal - amountReceived, 0)),
      advanceOutstanding: round2(Math.max(advanceRequired - amountReceived, 0)),
      isFullyPaid: amountReceived >= grandTotal && grandTotal > 0,
      payments,
    };
  }

  async create(quotationId: string, dto: CreatePaymentDto, userId?: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      include: { project: { select: { id: true } } },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const payment = await this.prisma.projectPayment.create({
      data: {
        quotationId,
        projectId: quotation.project?.id,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
        amount: dto.amount,
        method: dto.method ?? 'CASH',
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        createdById: userId,
        updatedById: userId,
      },
    });

    if (quotation.project) {
      await this.prisma.projectActivity.create({
        data: {
          projectId: quotation.project.id,
          type: 'PAYMENT_RECEIVED',
          title: `Payment received: Rs. ${Number(dto.amount).toLocaleString('en-IN')}`,
          description:
            [dto.method, dto.referenceNumber].filter(Boolean).join(' · ') ||
            undefined,
          createdById: userId,
        },
      });
    }
    await this.auditLogService.log({
      userId,
      action: 'CREATE',
      module: 'payment',
      entityType: 'ProjectPayment',
      entityId: payment.id,
      newValues: payment,
    });
    return this.summary(quotationId);
  }

  private async findPayment(quotationId: string, paymentId: string) {
    const payment = await this.prisma.projectPayment.findFirst({
      where: { id: paymentId, quotationId, deletedAt: null },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async update(
    quotationId: string,
    paymentId: string,
    dto: UpdatePaymentDto,
    userId?: string,
  ) {
    await this.findPayment(quotationId, paymentId);
    await this.prisma.projectPayment.update({
      where: { id: paymentId },
      data: {
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        amount: dto.amount,
        method: dto.method,
        referenceNumber: dto.referenceNumber,
        notes: dto.notes,
        updatedById: userId,
      },
    });
    return this.summary(quotationId);
  }

  async remove(quotationId: string, paymentId: string, userId?: string) {
    await this.findPayment(quotationId, paymentId);
    await this.prisma.projectPayment.update({
      where: { id: paymentId },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return this.summary(quotationId);
  }
}
