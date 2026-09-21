import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import { FileStorageService } from '../shared/services/file-storage.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryTestimonialDto } from './dto/query-testimonial.dto';

@Injectable()
export class TestimonialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(
    dto: CreateTestimonialDto,
    avatarUrl: string | undefined,
    userId?: string,
  ) {
    const testimonial = await this.prisma.testimonial.create({
      data: {
        ...dto,
        avatarUrl,
        createdById: userId,
        updatedById: userId,
      },
    });

    await this.auditLogService.log({
      userId,
      action: 'CREATE',
      module: 'testimonial',
      entityType: 'Testimonial',
      entityId: testimonial.id,
      newValues: testimonial,
    });

    return testimonial;
  }

  async findAll(query: QueryTestimonialDto): Promise<Paginated<unknown>> {
    const { page, limit, search, sortBy, sortOrder, status, isFeatured } =
      query;
    const skip = toSkip(page, limit);

    const where: Prisma.TestimonialWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(isFeatured === 'true' ? { isFeatured: true } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search } },
              { quote: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.testimonial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.testimonial.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findFirst({
      where: { id, deletedAt: null },
    });
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  async update(
    id: string,
    dto: UpdateTestimonialDto,
    avatarUrl: string | undefined,
    userId?: string,
  ) {
    const existing = await this.findOne(id);

    const testimonial = await this.prisma.testimonial.update({
      where: { id },
      data: { ...dto, avatarUrl, updatedById: userId },
    });

    if (avatarUrl && avatarUrl !== existing.avatarUrl) {
      this.fileStorageService.deleteByPublicUrl(existing.avatarUrl);
    }

    await this.auditLogService.log({
      userId,
      action: 'UPDATE',
      module: 'testimonial',
      entityType: 'Testimonial',
      entityId: id,
      oldValues: existing,
      newValues: testimonial,
    });

    return testimonial;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.testimonial.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    this.fileStorageService.deleteByPublicUrl(existing.avatarUrl);
    return { message: 'Testimonial deleted successfully' };
  }
}
