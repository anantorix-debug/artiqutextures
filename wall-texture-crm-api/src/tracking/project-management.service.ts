import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../shared/services/audit-log.service';
import { FileStorageService } from '../shared/services/file-storage.service';
import { PaymentService } from '../quotation/payment.service';
import {
  CreateColorDto,
  CreateExpenseDto,
  CreateMaterialDto,
  ImportMaterialsDto,
  PublishToGalleryDto,
  QueryExpenseDto,
  UpdateColorDto,
  UpdateExpenseDto,
  UpdateMaterialDto,
  UpdatePhotoDto,
  UploadPhotosDto,
} from './dto/project-management.dto';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const inr = (n: number) => `Rs. ${n.toLocaleString('en-IN')}`;

export interface UploadedPhotoFile {
  url: string;
  originalName: string;
}

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly fileStorage: FileStorageService,
    private readonly paymentService: PaymentService,
  ) {}

  // ---------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------

  private async ensureProject(id: string) {
    const project = await this.prisma.projectTracking.findFirst({
      where: { id, deletedAt: null },
      include: { quotation: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async logActivity(
    projectId: string,
    type: string,
    title: string,
    description?: string | null,
    userId?: string,
  ) {
    await this.prisma.projectActivity.create({
      data: {
        projectId,
        type,
        title: title.slice(0, 255),
        description: description ?? undefined,
        createdById: userId,
      },
    });
  }

  /** Deletes an uploaded file unless another record (gallery entry) still points at it. */
  private async deleteFileIfUnused(url?: string | null) {
    if (!url) return;
    const [galleryMain, galleryPhoto, projectPhoto] = await Promise.all([
      this.prisma.gallery.count({ where: { imageUrl: url, deletedAt: null } }),
      this.prisma.galleryPhoto.count({ where: { fileUrl: url } }),
      this.prisma.projectPhoto.count({ where: { fileUrl: url, deletedAt: null } }),
    ]);
    if (galleryMain + galleryPhoto + projectPhoto === 0) {
      this.fileStorage.deleteByPublicUrl(url);
    }
  }

  // ---------------------------------------------------------------------
  // Overview / financial summary
  // ---------------------------------------------------------------------

  async summary(projectId: string) {
    const project = await this.ensureProject(projectId);
    const [expenseAgg, byCategory, counts, payments] = await Promise.all([
      this.prisma.projectExpense.aggregate({
        where: { projectId, deletedAt: null },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.projectExpense.groupBy({
        by: ['category'],
        where: { projectId, deletedAt: null },
        _sum: { amount: true },
      }),
      Promise.all([
        this.prisma.projectMaterial.count({ where: { projectId, deletedAt: null } }),
        this.prisma.projectColor.count({ where: { projectId, deletedAt: null } }),
        this.prisma.projectPhoto.count({ where: { projectId, deletedAt: null } }),
      ]),
      this.paymentService.summary(project.quotationId),
    ]);

    const projectValue = Number(project.quotation.grandTotal);
    const totalExpenses = round2(Number(expenseAgg._sum.amount ?? 0));
    const estimatedProfit = round2(projectValue - totalExpenses);
    const profitMargin =
      projectValue > 0 ? round2((estimatedProfit / projectValue) * 100) : 0;

    return {
      projectValue,
      totalExpenses,
      estimatedProfit,
      profitMargin,
      expenseCount: expenseAgg._count._all,
      expensesByCategory: byCategory.map((r) => ({
        category: r.category,
        total: round2(Number(r._sum.amount ?? 0)),
      })),
      materialCount: counts[0],
      colorCount: counts[1],
      photoCount: counts[2],
      payments,
    };
  }

  async listActivities(projectId: string) {
    await this.ensureProject(projectId);
    const items = await this.prisma.projectActivity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const userIds = [...new Set(items.map((i) => i.createdById).filter(Boolean))] as string[];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const names = new Map(users.map((u) => [u.id, u.name]));
    return items.map((i) => ({
      ...i,
      userName: i.createdById ? (names.get(i.createdById) ?? null) : null,
    }));
  }

  // ---------------------------------------------------------------------
  // Expenses
  // ---------------------------------------------------------------------

  async listExpenses(projectId: string, q: QueryExpenseDto) {
    await this.ensureProject(projectId);
    const where: Prisma.ProjectExpenseWhereInput = {
      projectId,
      deletedAt: null,
      ...(q.category ? { category: q.category } : {}),
      ...((q.from || q.to)
        ? {
            expenseDate: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(new Date(q.to).setHours(23, 59, 59, 999)) } : {}),
            },
          }
        : {}),
      ...(q.search
        ? {
            OR: [
              { description: { contains: q.search } },
              { vendor: { contains: q.search } },
              { paidBy: { contains: q.search } },
            ],
          }
        : {}),
    };
    const items = await this.prisma.projectExpense.findMany({
      where,
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });
    const total = round2(items.reduce((s, e) => s + Number(e.amount), 0));
    return { items, total, count: items.length };
  }

  async createExpense(
    projectId: string,
    dto: CreateExpenseDto,
    receiptUrl: string | undefined,
    userId?: string,
  ) {
    await this.ensureProject(projectId);
    const { removeReceipt: _ignored, ...rest } = dto;
    void _ignored;
    const expense = await this.prisma.projectExpense.create({
      data: {
        ...rest,
        projectId,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        receiptUrl,
        createdById: userId,
        updatedById: userId,
      },
    });
    await this.logActivity(
      projectId,
      'EXPENSE_ADDED',
      `Expense added: ${expense.description}`,
      `${dto.category} · ${inr(Number(expense.amount))}`,
      userId,
    );
    return expense;
  }

  private async findExpense(projectId: string, id: string) {
    const expense = await this.prisma.projectExpense.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async updateExpense(
    projectId: string,
    id: string,
    dto: UpdateExpenseDto,
    receiptUrl: string | undefined,
    userId?: string,
  ) {
    const existing = await this.findExpense(projectId, id);
    const { removeReceipt, ...rest } = dto;
    const nextReceipt = receiptUrl ?? (removeReceipt ? null : undefined);
    const expense = await this.prisma.projectExpense.update({
      where: { id },
      data: {
        ...rest,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        receiptUrl: nextReceipt,
        updatedById: userId,
      },
    });
    if (nextReceipt !== undefined && existing.receiptUrl && existing.receiptUrl !== nextReceipt) {
      this.fileStorage.deleteByPublicUrl(existing.receiptUrl);
    }
    await this.logActivity(
      projectId,
      'EXPENSE_UPDATED',
      `Expense updated: ${expense.description}`,
      inr(Number(expense.amount)),
      userId,
    );
    return expense;
  }

  async removeExpense(projectId: string, id: string, userId?: string) {
    const existing = await this.findExpense(projectId, id);
    await this.prisma.projectExpense.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    this.fileStorage.deleteByPublicUrl(existing.receiptUrl);
    await this.logActivity(
      projectId,
      'EXPENSE_DELETED',
      `Expense deleted: ${existing.description}`,
      inr(Number(existing.amount)),
      userId,
    );
    return { message: 'Expense deleted' };
  }

  // ---------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------

  async listMaterials(projectId: string) {
    const project = await this.ensureProject(projectId);
    const [materials, quotationItems] = await Promise.all([
      this.prisma.projectMaterial.findMany({
        where: { projectId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: {
          quotationItem: { select: { id: true, srNo: true, productName: true } },
        },
      }),
      this.prisma.quotationItem.findMany({
        where: { quotationId: project.quotationId, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, srNo: true, productName: true, sqft: true, description: true },
      }),
    ]);
    const linked = new Set(materials.map((m) => m.quotationItemId).filter(Boolean));
    return {
      items: materials,
      quotationItems: quotationItems.map((qi) => ({ ...qi, linked: linked.has(qi.id) })),
    };
  }

  private async assertItemBelongs(projectId: string, quotationItemId?: string) {
    if (!quotationItemId) return;
    const project = await this.ensureProject(projectId);
    const item = await this.prisma.quotationItem.findFirst({
      where: { id: quotationItemId, quotationId: project.quotationId },
    });
    if (!item) throw new BadRequestException('Quotation item does not belong to this project');
  }

  async createMaterial(projectId: string, dto: CreateMaterialDto, userId?: string) {
    await this.ensureProject(projectId);
    await this.assertItemBelongs(projectId, dto.quotationItemId);
    const material = await this.prisma.projectMaterial.create({
      data: { ...dto, unit: dto.unit || 'Sq.ft', projectId, createdById: userId, updatedById: userId },
    });
    await this.logActivity(
      projectId,
      'MATERIAL_ADDED',
      `Material added: ${material.name}`,
      `${Number(material.quantity)} ${material.unit}`,
      userId,
    );
    return material;
  }

  /** Copies quotation lines into project materials so the data isn't typed twice. */
  async importMaterials(projectId: string, dto: ImportMaterialsDto, userId?: string) {
    const project = await this.ensureProject(projectId);
    const existing = await this.prisma.projectMaterial.findMany({
      where: { projectId, deletedAt: null, quotationItemId: { not: null } },
      select: { quotationItemId: true },
    });
    const already = new Set(existing.map((e) => e.quotationItemId));
    const items = await this.prisma.quotationItem.findMany({
      where: {
        quotationId: project.quotationId,
        deletedAt: null,
        ...(dto.quotationItemIds?.length ? { id: { in: dto.quotationItemIds } } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    const fresh = items.filter((i) => !already.has(i.id));
    if (fresh.length === 0) return { created: 0, items: [] };

    await this.prisma.projectMaterial.createMany({
      data: fresh.map((i) => ({
        projectId,
        quotationItemId: i.id,
        name: i.productName,
        quantity: i.sqft,
        unit: 'Sq.ft',
        description: i.description,
        createdById: userId,
        updatedById: userId,
      })),
    });
    await this.logActivity(
      projectId,
      'MATERIAL_ADDED',
      `${fresh.length} material${fresh.length > 1 ? 's' : ''} imported from quotation`,
      fresh.map((i) => i.productName).join(', '),
      userId,
    );
    return { created: fresh.length };
  }

  private async findMaterial(projectId: string, id: string) {
    const m = await this.prisma.projectMaterial.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!m) throw new NotFoundException('Material not found');
    return m;
  }

  async updateMaterial(projectId: string, id: string, dto: UpdateMaterialDto, userId?: string) {
    await this.findMaterial(projectId, id);
    await this.assertItemBelongs(projectId, dto.quotationItemId);
    const material = await this.prisma.projectMaterial.update({
      where: { id },
      data: { ...dto, updatedById: userId },
    });
    await this.logActivity(projectId, 'MATERIAL_UPDATED', `Material updated: ${material.name}`, null, userId);
    return material;
  }

  async removeMaterial(projectId: string, id: string, userId?: string) {
    const existing = await this.findMaterial(projectId, id);
    await this.prisma.projectMaterial.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.logActivity(projectId, 'MATERIAL_DELETED', `Material removed: ${existing.name}`, null, userId);
    return { message: 'Material deleted' };
  }

  // ---------------------------------------------------------------------
  // Colors
  // ---------------------------------------------------------------------

  async listColors(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.projectColor.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  private normHex(hex?: string) {
    if (!hex) return undefined;
    let h = hex.toUpperCase();
    if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    return h;
  }

  async createColor(
    projectId: string,
    dto: CreateColorDto,
    referenceImageUrl: string | undefined,
    userId?: string,
  ) {
    await this.ensureProject(projectId);
    const { removeReferenceImage: _ignored, ...rest } = dto;
    void _ignored;
    const color = await this.prisma.projectColor.create({
      data: {
        ...rest,
        hexCode: this.normHex(dto.hexCode)!,
        projectId,
        referenceImageUrl,
        createdById: userId,
        updatedById: userId,
      },
    });
    await this.logActivity(
      projectId,
      'COLOR_ADDED',
      `Color added: ${color.name}`,
      color.hexCode,
      userId,
    );
    return color;
  }

  private async findColor(projectId: string, id: string) {
    const c = await this.prisma.projectColor.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!c) throw new NotFoundException('Color not found');
    return c;
  }

  async updateColor(
    projectId: string,
    id: string,
    dto: UpdateColorDto,
    referenceImageUrl: string | undefined,
    userId?: string,
  ) {
    const existing = await this.findColor(projectId, id);
    const { removeReferenceImage, ...rest } = dto;
    const nextImage = referenceImageUrl ?? (removeReferenceImage ? null : undefined);
    const color = await this.prisma.projectColor.update({
      where: { id },
      data: {
        ...rest,
        hexCode: this.normHex(dto.hexCode),
        referenceImageUrl: nextImage,
        updatedById: userId,
      },
    });
    if (nextImage !== undefined && existing.referenceImageUrl && existing.referenceImageUrl !== nextImage) {
      this.fileStorage.deleteByPublicUrl(existing.referenceImageUrl);
    }
    await this.logActivity(projectId, 'COLOR_UPDATED', `Color updated: ${color.name}`, color.hexCode, userId);
    return color;
  }

  async removeColor(projectId: string, id: string, userId?: string) {
    const existing = await this.findColor(projectId, id);
    await this.prisma.projectColor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    this.fileStorage.deleteByPublicUrl(existing.referenceImageUrl);
    await this.logActivity(projectId, 'COLOR_DELETED', `Color removed: ${existing.name}`, null, userId);
    return { message: 'Color deleted' };
  }

  // ---------------------------------------------------------------------
  // Photos
  // ---------------------------------------------------------------------

  async listPhotos(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.projectPhoto.findMany({
      where: { projectId, deletedAt: null },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        material: { select: { id: true, name: true } },
        color: { select: { id: true, name: true, hexCode: true } },
      },
    });
  }

  private async assertLinks(projectId: string, materialId?: string, colorId?: string) {
    if (materialId) {
      await this.findMaterial(projectId, materialId).catch(() => {
        throw new BadRequestException('Linked material does not belong to this project');
      });
    }
    if (colorId) {
      await this.findColor(projectId, colorId).catch(() => {
        throw new BadRequestException('Linked color does not belong to this project');
      });
    }
  }

  /** One upload request can carry many images; they all share the chosen stage/caption/links. */
  async uploadPhotos(
    projectId: string,
    dto: UploadPhotosDto,
    files: UploadedPhotoFile[],
    userId?: string,
  ) {
    await this.ensureProject(projectId);
    if (files.length === 0) throw new BadRequestException('Select at least one image');
    await this.assertLinks(projectId, dto.materialId, dto.colorId);

    const takenAt = dto.takenAt ? new Date(dto.takenAt) : new Date();
    const created = await this.prisma.$transaction(
      files.map((f) =>
        this.prisma.projectPhoto.create({
          data: {
            projectId,
            stage: dto.stage ?? 'OTHER',
            fileUrl: f.url,
            fileName: f.originalName.slice(0, 255),
            caption: dto.caption,
            description: dto.description,
            takenAt,
            materialId: dto.materialId,
            colorId: dto.colorId,
            createdById: userId,
            updatedById: userId,
          },
        }),
      ),
    );
    await this.logActivity(
      projectId,
      'PHOTOS_UPLOADED',
      `${created.length} photo${created.length > 1 ? 's' : ''} uploaded`,
      `Stage: ${dto.stage ?? 'OTHER'}`,
      userId,
    );
    return created;
  }

  private async findPhoto(projectId: string, id: string) {
    const p = await this.prisma.projectPhoto.findFirst({
      where: { id, projectId, deletedAt: null },
    });
    if (!p) throw new NotFoundException('Photo not found');
    return p;
  }

  async updatePhoto(projectId: string, id: string, dto: UpdatePhotoDto, userId?: string) {
    await this.findPhoto(projectId, id);
    await this.assertLinks(projectId, dto.materialId, dto.colorId);
    return this.prisma.projectPhoto.update({
      where: { id },
      data: {
        stage: dto.stage,
        caption: dto.caption,
        description: dto.description,
        takenAt: dto.takenAt ? new Date(dto.takenAt) : undefined,
        materialId: dto.materialId,
        colorId: dto.colorId,
        updatedById: userId,
      },
    });
  }

  async removePhoto(projectId: string, id: string, userId?: string) {
    const existing = await this.findPhoto(projectId, id);
    await this.prisma.projectPhoto.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.deleteFileIfUnused(existing.fileUrl);
    await this.logActivity(projectId, 'PHOTO_DELETED', 'Photo deleted', existing.fileName, userId);
    return { message: 'Photo deleted' };
  }

  // ---------------------------------------------------------------------
  // Publish to gallery
  // ---------------------------------------------------------------------

  async publishToGallery(projectId: string, dto: PublishToGalleryDto, userId?: string) {
    const project = await this.prisma.projectTracking.findFirst({
      where: { id: projectId, deletedAt: null },
      include: { customer: true, quotation: { select: { quotationNumber: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed projects can be published to the gallery');
    }
    if (!dto.photoIds?.length) {
      throw new BadRequestException('Select at least one photo to display');
    }
    if (dto.categoryId) {
      const cat = await this.prisma.galleryCategory.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!cat) throw new BadRequestException('Gallery category not found');
    }

    const photos = await this.prisma.projectPhoto.findMany({
      where: { id: { in: dto.photoIds }, projectId, deletedAt: null },
    });
    // keep the order the user picked
    const ordered = dto.photoIds
      .map((pid) => photos.find((p) => p.id === pid))
      .filter((p): p is (typeof photos)[number] => !!p);
    if (ordered.length === 0) throw new BadRequestException('None of the selected photos belong to this project');

    const [materials, colors] = await Promise.all([
      this.prisma.projectMaterial.findMany({ where: { projectId, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
      this.prisma.projectColor.findMany({ where: { projectId, deletedAt: null }, orderBy: { createdAt: 'asc' } }),
    ]);

    const tags = (dto.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const completedAt = project.actualCompletionDate ?? project.updatedAt;
    const title = dto.title?.trim() || project.projectName;
    const description =
      dto.description?.trim() ||
      project.remarks?.trim() ||
      `${project.projectName} — completed for ${project.customer.customerName}.`;
    const subtitle = [project.customer.city, completedAt.getFullYear()].filter(Boolean).join(' · ');

    const data = {
      title,
      type: 'PORTFOLIO' as const,
      categoryId: dto.categoryId ?? null,
      description,
      subtitle,
      tags: tags.length ? JSON.stringify(tags) : null,
      imageUrl: ordered[0].fileUrl,
      thumbnailUrl: ordered[0].fileUrl,
      isFeatured: dto.isFeatured ?? false,
      status: dto.status ?? ('ACTIVE' as const),
      completedAt,
      materialsUsed: JSON.stringify(
        materials.map((m) => ({
          name: m.name,
          brand: m.brand,
          quantity: Number(m.quantity),
          unit: m.unit,
        })),
      ),
      colorsUsed: JSON.stringify(
        colors.map((c) => ({
          name: c.name,
          hexCode: c.hexCode,
          brand: c.brand,
          shadeNumber: c.shadeNumber,
          finish: c.finish,
          usedIn: c.usedIn,
        })),
      ),
      deletedAt: null,
      updatedById: userId,
    };
    const photoRows = ordered.map((p, i) => ({
      fileUrl: p.fileUrl,
      thumbnailUrl: p.fileUrl,
      caption: p.caption,
      sortOrder: i,
    }));

    const existing = await this.prisma.gallery.findUnique({ where: { projectId } });
    const gallery = await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.galleryPhoto.deleteMany({ where: { galleryId: existing.id } });
        return tx.gallery.update({
          where: { id: existing.id },
          data: { ...data, photos: { create: photoRows } },
          include: { photos: true, category: true },
        });
      }
      return tx.gallery.create({
        data: { ...data, projectId, createdById: userId, photos: { create: photoRows } },
        include: { photos: true, category: true },
      });
    });

    await this.logActivity(
      projectId,
      'GALLERY_PUBLISHED',
      existing ? 'Gallery entry updated' : 'Published to gallery',
      `${ordered.length} photo${ordered.length > 1 ? 's' : ''} · ${title}`,
      userId,
    );
    await this.auditLogService.log({
      userId,
      action: existing ? 'UPDATE' : 'CREATE',
      module: 'gallery',
      entityType: 'Gallery',
      entityId: gallery.id,
      newValues: gallery,
    });
    return gallery;
  }

  async getGalleryEntry(projectId: string) {
    await this.ensureProject(projectId);
    const gallery = await this.prisma.gallery.findFirst({
      where: { projectId, deletedAt: null },
      include: { photos: { orderBy: { sortOrder: 'asc' } }, category: true },
    });
    return gallery;
  }

  /** Removes the project from the gallery. Photos stay on the project — files are untouched. */
  async unpublishFromGallery(projectId: string, userId?: string) {
    await this.ensureProject(projectId);
    const gallery = await this.prisma.gallery.findFirst({ where: { projectId, deletedAt: null } });
    if (!gallery) throw new NotFoundException('This project is not in the gallery');
    await this.prisma.gallery.update({
      where: { id: gallery.id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.logActivity(projectId, 'GALLERY_UNPUBLISHED', 'Removed from gallery', null, userId);
    return { message: 'Removed from gallery' };
  }
}
