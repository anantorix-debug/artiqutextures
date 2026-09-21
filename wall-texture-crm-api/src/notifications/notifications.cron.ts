import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

/**
 * Daily reminder sweeps backing the "Lead Follow-up Reminder", "Quotation
 * Reminder" and "Project Status Reminder" notification types from the spec.
 * There is no per-lead/project assignee in this system, so reminders fan
 * out to every active user (see NotificationsService.broadcast dedupe).
 */
@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleLeadFollowUps() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const leads = await this.prisma.customer.findMany({
      where: {
        deletedAt: null,
        followUpDate: { lte: today },
        status: { notIn: ['WON', 'LOST'] },
      },
      select: { id: true, customerName: true, followUpDate: true },
    });

    for (const lead of leads) {
      await this.notificationsService.broadcast(
        'LEAD_FOLLOWUP',
        'Follow-up due',
        `Follow up with ${lead.customerName} — scheduled for ${lead.followUpDate?.toLocaleDateString('en-IN')}`,
        `/leads/${lead.id}`,
      );
    }
    this.logger.log(`Lead follow-up sweep: ${leads.length} lead(s) due`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleQuotationReminders() {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const quotations = await this.prisma.quotation.findMany({
      where: {
        deletedAt: null,
        status: 'SENT',
        validUntil: { lte: twoDaysFromNow, not: null },
      },
      select: { id: true, quotationNumber: true, validUntil: true },
    });

    for (const quotation of quotations) {
      await this.notificationsService.broadcast(
        'QUOTATION_REMINDER',
        'Quotation expiring soon',
        `Quotation ${quotation.quotationNumber} is awaiting a response and expires on ${quotation.validUntil?.toLocaleDateString('en-IN')}`,
        `/quotations/${quotation.id}`,
      );
    }
    this.logger.log(
      `Quotation reminder sweep: ${quotations.length} quotation(s) expiring soon`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleProjectStatusReminders() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const projects = await this.prisma.projectTracking.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        expectedCompletionDate: { lte: today, not: null },
      },
      select: {
        id: true,
        projectName: true,
        expectedCompletionDate: true,
        status: true,
      },
    });

    for (const project of projects) {
      await this.notificationsService.broadcast(
        'PROJECT_STATUS',
        'Project deadline reached',
        `"${project.projectName}" was expected to complete on ${project.expectedCompletionDate?.toLocaleDateString('en-IN')} (currently ${project.status})`,
        `/tracking/${project.id}`,
      );
    }
    this.logger.log(
      `Project status sweep: ${projects.length} project(s) at/past deadline`,
    );
  }
}
