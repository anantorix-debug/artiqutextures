import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  }

  /**
   * Fans a reminder out to every active user (there is no lead/project
   * "assignee" concept in this system — the whole team sees it) while
   * skipping anyone already notified about the same link recently, so a
   * daily cron tick doesn't spam duplicate toasts.
   */
  async broadcast(
    type: NotificationType,
    title: string,
    message: string,
    link: string,
    dedupeWindowHours = 20,
  ) {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });

    const since = new Date(Date.now() - dedupeWindowHours * 60 * 60 * 1000);
    let created = 0;

    for (const user of users) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: { userId: user.id, type, link, createdAt: { gte: since } },
      });
      if (alreadyNotified) continue;

      await this.create(user.id, type, title, message, link);
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Broadcast "${title}" to ${created} user(s)`);
    }
  }

  async findAllForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<Paginated<unknown>> {
    const { page, limit, sortBy, sortOrder } = query;
    const skip = toSkip(page, limit);

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notification.count({ where: { userId, deletedAt: null } }),
      this.prisma.notification.count({
        where: { userId, deletedAt: null, isRead: false },
      }),
    ]);

    return {
      items: items.map((i) => ({ ...i, unreadCount })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, deletedAt: null, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Notification removed' };
  }
}
