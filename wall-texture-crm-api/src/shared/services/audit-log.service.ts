import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId?: string | null;
  action: AuditAction;
  module: string;
  entityType?: string;
  entityId?: string;
  description?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Every module writes here instead of hand-rolling `prisma.auditLog.create`,
 * so the audit trail format (and the Settings > Audit Logs screen) stays consistent.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        module: entry.module,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        oldValues: entry.oldValues as never,
        newValues: entry.newValues as never,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }
}
