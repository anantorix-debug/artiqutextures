import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectDto } from './dto/query-project.dto';

const PROJECT_INCLUDE = {
  customer: {
    select: { id: true, customerName: true, phone: true, city: true },
  },
  quotation: {
    select: {
      id: true,
      quotationNumber: true,
      grandTotal: true,
      advanceRequired: true,
      status: true,
      quotationDate: true,
    },
  },
  galleryEntry: { select: { id: true, deletedAt: true } },
} satisfies Prisma.ProjectTrackingInclude;

@Injectable()
export class TrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findAll(query: QueryProjectDto): Promise<Paginated<unknown>> {
    const { page, limit, search, sortBy, sortOrder, status, customerId } =
      query;
    const skip = toSkip(page, limit);

    const where: Prisma.ProjectTrackingWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { projectName: { contains: search } },
              { customer: { customerName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.projectTracking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: PROJECT_INCLUDE,
      }),
      this.prisma.projectTracking.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const project = await this.prisma.projectTracking.findFirst({
      where: { id, deletedAt: null },
      include: PROJECT_INCLUDE,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId?: string) {
    const existing = await this.findOne(id);

    // Completing a project finishes the job: 100% progress and a completion date.
    const completing = dto.status === 'COMPLETED' && existing.status !== 'COMPLETED';
    const startingNow =
      (dto.status === 'STARTED' || dto.status === 'IN_PROGRESS') &&
      existing.status === 'PENDING';
    const progressPercentage =
      dto.progressPercentage ?? (completing ? 100 : undefined);
    const actualCompletionDate = dto.actualCompletionDate
      ? new Date(dto.actualCompletionDate)
      : completing && !existing.actualCompletionDate
        ? new Date()
        : undefined;
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : startingNow && !existing.startDate
        ? new Date()
        : undefined;

    const project = await this.prisma.projectTracking.update({
      where: { id },
      data: {
        projectName: dto.projectName,
        startDate,
        expectedCompletionDate: dto.expectedCompletionDate
          ? new Date(dto.expectedCompletionDate)
          : undefined,
        actualCompletionDate,
        status: dto.status,
        assignedTeam: dto.assignedTeam,
        progressPercentage,
        currentStage: dto.currentStage,
        remarks: dto.remarks,
        updatedById: userId,
      },
      include: PROJECT_INCLUDE,
    });

    // ---- project activity timeline ----
    const events: Array<[string, string, string?]> = [];
    if (startingNow) events.push(['PROJECT_STARTED', 'Project started']);
    if (completing) events.push(['PROJECT_COMPLETED', 'Project completed']);
    if (dto.status && dto.status !== existing.status && !startingNow && !completing) {
      events.push(['STATUS_CHANGED', `Status changed to ${dto.status.replace('_', ' ')}`, `Was ${existing.status.replace('_', ' ')}`]);
    }
    if (
      progressPercentage !== undefined &&
      progressPercentage !== existing.progressPercentage
    ) {
      events.push([
        'PROGRESS_CHANGED',
        `Progress ${existing.progressPercentage}% → ${progressPercentage}%`,
        dto.currentStage ?? undefined,
      ]);
    } else if (dto.currentStage && dto.currentStage !== existing.currentStage) {
      events.push(['STAGE_CHANGED', `Stage: ${dto.currentStage}`]);
    }
    if (dto.assignedTeam !== undefined && dto.assignedTeam !== existing.assignedTeam) {
      events.push(['TEAM_CHANGED', 'Assigned team updated', dto.assignedTeam || undefined]);
    }
    if (dto.remarks !== undefined && dto.remarks !== existing.remarks) {
      events.push(['REMARKS_UPDATED', 'Remarks updated']);
    }
    if (events.length) {
      await this.prisma.projectActivity.createMany({
        data: events.map(([type, title, description]) => ({
          projectId: id,
          type,
          title,
          description,
          createdById: userId,
        })),
      });
    }

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.customerActivity.create({
        data: {
          customerId: existing.customerId,
          type: 'STATUS_CHANGE',
          title: `Project "${existing.projectName}" status changed to ${dto.status}`,
          createdById: userId,
        },
      });
    }

    await this.auditLogService.log({
      userId,
      action: 'UPDATE',
      module: 'tracking',
      entityType: 'ProjectTracking',
      entityId: id,
      oldValues: existing,
      newValues: project,
    });

    return project;
  }

  async remove(id: string, userId?: string) {
    await this.findOne(id);
    await this.prisma.projectTracking.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: 'Project deleted successfully' };
  }
}
