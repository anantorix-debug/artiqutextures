import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import { FileStorageService } from '../shared/services/file-storage.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** "Teak, White Oak, Ash" -> '["Teak","White Oak","Ash"]' for storage. */
function tagsToJson(tags?: string): string | null | undefined {
  if (tags === undefined) return undefined;
  const list = tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return list.length > 0 ? JSON.stringify(list) : null;
}

function parseJson<R>(raw: string | null | undefined, fallback: R): R {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as R;
  } catch {
    return fallback;
  }
}

/**
 * Reshapes the JSON-string columns (`tags`, and for project-published entries
 * `materialsUsed` / `colorsUsed`) into real arrays for API consumers.
 */
function withParsedTags<
  T extends {
    tags: string | null;
    materialsUsed?: string | null;
    colorsUsed?: string | null;
  },
>(
  row: T,
): Omit<T, 'tags' | 'materialsUsed' | 'colorsUsed'> & {
  tags: string[];
  materialsUsed: Array<Record<string, unknown>>;
  colorsUsed: Array<Record<string, unknown>>;
} {
  return {
    ...row,
    tags: parseJson<string[]>(row.tags, []),
    materialsUsed: parseJson(row.materialsUsed, []),
    colorsUsed: parseJson(row.colorsUsed, []),
  };
}

const GALLERY_INCLUDE = {
  category: true,
  photos: { orderBy: { sortOrder: 'asc' } },
  project: { select: { id: true, projectName: true } },
} satisfies Prisma.GalleryInclude;

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  // ---------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------

  async createCategory(dto: CreateGalleryCategoryDto, userId?: string) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.galleryCategory.findFirst({
      where: { slug },
    });
    if (existing)
      throw new BadRequestException('A category with this name already exists');

    return this.prisma.galleryCategory.create({
      data: { ...dto, slug, createdById: userId, updatedById: userId },
    });
  }

  async findAllCategories() {
    return this.prisma.galleryCategory.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { images: true } } },
    });
  }

  async findCategory(id: string) {
    const category = await this.prisma.galleryCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Gallery category not found');
    return category;
  }

  async updateCategory(
    id: string,
    dto: UpdateGalleryCategoryDto,
    userId?: string,
  ) {
    await this.findCategory(id);
    return this.prisma.galleryCategory.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.name ? slugify(dto.name) : undefined,
        updatedById: userId,
      },
    });
  }

  async removeCategory(id: string, userId?: string) {
    await this.findCategory(id);
    const imageCount = await this.prisma.gallery.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (imageCount > 0) {
      throw new BadRequestException(
        'Cannot delete a category that still has gallery images',
      );
    }
    await this.prisma.galleryCategory.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { message: 'Category deleted successfully' };
  }

  // ---------------------------------------------------------------------
  // Gallery Images
  // ---------------------------------------------------------------------

  async create(
    dto: CreateGalleryDto,
    imageUrl: string,
    thumbnailUrl: string | undefined,
    userId?: string,
  ) {
    const type = dto.type ?? 'PORTFOLIO';
    if (type === 'DESIGN' && !dto.categoryId) {
      throw new BadRequestException('categoryId is required for a Design entry');
    }
    if (dto.categoryId) await this.findCategory(dto.categoryId);

    const gallery = await this.prisma.gallery.create({
      data: {
        title: dto.title,
        type,
        categoryId: dto.categoryId,
        description: dto.description,
        subtitle: dto.subtitle,
        tags: tagsToJson(dto.tags),
        imageUrl,
        thumbnailUrl: thumbnailUrl ?? imageUrl,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        createdById: userId,
        updatedById: userId,
      },
      include: { category: true },
    });

    await this.auditLogService.log({
      userId,
      action: 'CREATE',
      module: 'gallery',
      entityType: 'Gallery',
      entityId: gallery.id,
      newValues: gallery,
    });

    return withParsedTags(gallery);
  }

  async findAll(query: QueryGalleryDto): Promise<Paginated<unknown>> {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      categoryId,
      status,
      type,
      isFeatured,
      tag,
      completedOnly,
    } = query;
    const skip = toSkip(page, limit);

    const where: Prisma.GalleryWhereInput = {
      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(isFeatured === 'true' ? { isFeatured: true } : {}),
      ...(completedOnly === 'true' ? { projectId: { not: null } } : {}),
      ...(tag ? { tags: { contains: JSON.stringify(tag) } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.gallery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: GALLERY_INCLUDE,
      }),
      this.prisma.gallery.count({ where }),
    ]);

    return {
      items: items.map(withParsedTags),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: string) {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id, deletedAt: null },
      include: GALLERY_INCLUDE,
    });
    if (!gallery) throw new NotFoundException('Gallery image not found');
    return withParsedTags(gallery);
  }

  async update(
    id: string,
    dto: UpdateGalleryDto,
    imageUrl: string | undefined,
    thumbnailUrl: string | undefined,
    userId?: string,
  ) {
    const existing = await this.findOne(id);
    if (dto.categoryId) await this.findCategory(dto.categoryId);

    const gallery = await this.prisma.gallery.update({
      where: { id },
      data: {
        title: dto.title,
        type: dto.type,
        categoryId: dto.categoryId,
        description: dto.description,
        subtitle: dto.subtitle,
        tags: tagsToJson(dto.tags),
        imageUrl,
        thumbnailUrl,
        isFeatured: dto.isFeatured,
        sortOrder: dto.sortOrder,
        status: dto.status,
        updatedById: userId,
      },
      include: GALLERY_INCLUDE,
    });

    if (imageUrl && imageUrl !== existing.imageUrl && !existing.projectId) {
      this.fileStorageService.deleteByPublicUrl(existing.imageUrl);
    }
    if (
      thumbnailUrl &&
      thumbnailUrl !== existing.thumbnailUrl &&
      !existing.projectId
    ) {
      this.fileStorageService.deleteByPublicUrl(existing.thumbnailUrl);
    }

    return withParsedTags(gallery);
  }

  async remove(id: string, userId?: string) {
    const existing = await this.findOne(id);
    await this.prisma.gallery.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    // Entries published from a project reuse the project's photo files — keep them.
    if (!existing.projectId) {
      this.fileStorageService.deleteByPublicUrl(existing.imageUrl);
      if (existing.thumbnailUrl !== existing.imageUrl) {
        this.fileStorageService.deleteByPublicUrl(existing.thumbnailUrl);
      }
    }
    return { message: 'Gallery image deleted successfully' };
  }
}
