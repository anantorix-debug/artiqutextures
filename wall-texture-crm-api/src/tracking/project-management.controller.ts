import {
  Body,
  Controller,
  Delete,
  NotFoundException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectManagementService } from './project-management.service';
import { PaymentService } from '../quotation/payment.service';
import { PrismaService } from '../prisma/prisma.service';
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
import { CreatePaymentDto, UpdatePaymentDto } from '../quotation/dto/payment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { buildMulterOptions, toPublicUrl } from '../shared/utils/multer.config';
import { AppConfig } from '../config/configuration';

const uuid = new ParseUUIDPipe();

@ApiTags('Project Tracking')
@ApiBearerAuth()
@Controller('tracking/:projectId')
export class ProjectManagementController {
  private readonly uploadDir: string;

  constructor(
    private readonly pm: ProjectManagementService,
    private readonly payments: PaymentService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadDir = config.get<AppConfig>('app')!.upload.dir;
  }

  private url(folder: string, file?: Express.Multer.File) {
    return file ? toPublicUrl(this.uploadDir, folder, file.filename) : undefined;
  }

  // ---- overview -----------------------------------------------------------

  @Get('summary')
  @ApiOperation({ summary: 'Financial summary: value, expenses, profit, margin, counts, payments' })
  summary(@Param('projectId', uuid) projectId: string) {
    return this.pm.summary(projectId);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Project activity timeline' })
  activities(@Param('projectId', uuid) projectId: string) {
    return this.pm.listActivities(projectId);
  }

  // ---- expenses -----------------------------------------------------------

  @Get('expenses')
  @ApiOperation({ summary: 'List project expenses (filter by category / date / search) with total' })
  listExpenses(@Param('projectId', uuid) projectId: string, @Query() q: QueryExpenseDto) {
    return this.pm.listExpenses(projectId, q);
  }

  @Post('expenses')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add an expense (optional receipt upload)' })
  @UseInterceptors(FileInterceptor('receipt', buildMulterOptions('uploads', 'receipts', 'receipt')))
  createExpense(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: CreateExpenseDto,
    @UploadedFile() receipt: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.createExpense(projectId, dto, this.url('receipts', receipt), userId);
  }

  @Patch('expenses/:id')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Edit an expense (optionally replace the receipt)' })
  @UseInterceptors(FileInterceptor('receipt', buildMulterOptions('uploads', 'receipts', 'receipt')))
  updateExpense(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateExpenseDto,
    @UploadedFile() receipt: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.updateExpense(projectId, id, dto, this.url('receipts', receipt), userId);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete an expense' })
  removeExpense(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.removeExpense(projectId, id, userId);
  }

  // ---- materials ----------------------------------------------------------

  @Get('materials')
  @ApiOperation({ summary: 'Materials used + the quotation lines they can be linked to' })
  listMaterials(@Param('projectId', uuid) projectId: string) {
    return this.pm.listMaterials(projectId);
  }

  @Post('materials')
  @ApiOperation({ summary: 'Add a material' })
  createMaterial(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: CreateMaterialDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.createMaterial(projectId, dto, userId);
  }

  @Post('materials/import-from-quotation')
  @ApiOperation({ summary: 'Create materials from the quotation lines (no re-typing)' })
  importMaterials(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: ImportMaterialsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.importMaterials(projectId, dto, userId);
  }

  @Patch('materials/:id')
  @ApiOperation({ summary: 'Edit a material' })
  updateMaterial(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.updateMaterial(projectId, id, dto, userId);
  }

  @Delete('materials/:id')
  @ApiOperation({ summary: 'Delete a material' })
  removeMaterial(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.removeMaterial(projectId, id, userId);
  }

  // ---- colors -------------------------------------------------------------

  @Get('colors')
  @ApiOperation({ summary: 'Colors used on the project' })
  listColors(@Param('projectId', uuid) projectId: string) {
    return this.pm.listColors(projectId);
  }

  @Post('colors')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a color (optional reference image)' })
  @UseInterceptors(FileInterceptor('referenceImage', buildMulterOptions('uploads', 'colors', 'photo')))
  createColor(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: CreateColorDto,
    @UploadedFile() referenceImage: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.createColor(projectId, dto, this.url('colors', referenceImage), userId);
  }

  @Patch('colors/:id')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Edit a color' })
  @UseInterceptors(FileInterceptor('referenceImage', buildMulterOptions('uploads', 'colors', 'photo')))
  updateColor(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @Body() dto: UpdateColorDto,
    @UploadedFile() referenceImage: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.updateColor(projectId, id, dto, this.url('colors', referenceImage), userId);
  }

  @Delete('colors/:id')
  @ApiOperation({ summary: 'Delete a color' })
  removeColor(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.removeColor(projectId, id, userId);
  }

  // ---- photos -------------------------------------------------------------

  @Get('photos')
  @ApiOperation({ summary: 'Project photos (all stages)' })
  listPhotos(@Param('projectId', uuid) projectId: string) {
    return this.pm.listPhotos(projectId);
  }

  @Post('photos')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload one or many photos in a single multipart request (field name: photos)',
  })
  @UseInterceptors(
    FilesInterceptor('photos', 30, {
      ...buildMulterOptions('uploads', 'projects', 'photo'),
    }),
  )
  uploadPhotos(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: UploadPhotosDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.uploadPhotos(
      projectId,
      dto,
      (files ?? []).map((f) => ({
        url: toPublicUrl(this.uploadDir, 'projects', f.filename),
        originalName: f.originalname,
      })),
      userId,
    );
  }

  @Patch('photos/:id')
  @ApiOperation({ summary: 'Edit photo stage / caption / description / date / links' })
  updatePhoto(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @Body() dto: UpdatePhotoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.updatePhoto(projectId, id, dto, userId);
  }

  @Delete('photos/:id')
  @ApiOperation({ summary: 'Delete a photo' })
  removePhoto(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.removePhoto(projectId, id, userId);
  }

  // ---- payments (delegates to the quotation the project came from) --------

  private async quotationIdOf(projectId: string) {
    const p = await this.prisma.projectTracking.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { quotationId: true },
    });
    if (!p) throw new NotFoundException('Project not found');
    return p.quotationId;
  }

  @Get('payments')
  @ApiOperation({ summary: 'Payment summary and history for the project quotation' })
  async listPayments(@Param('projectId', uuid) projectId: string) {
    return this.payments.summary(await this.quotationIdOf(projectId));
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record a payment' })
  async addPayment(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.payments.create(await this.quotationIdOf(projectId), dto, userId);
  }

  @Patch('payments/:id')
  @ApiOperation({ summary: 'Edit a payment' })
  async updatePayment(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @Body() dto: UpdatePaymentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.payments.update(await this.quotationIdOf(projectId), id, dto, userId);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete a payment' })
  async removePayment(
    @Param('projectId', uuid) projectId: string,
    @Param('id', uuid) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payments.remove(await this.quotationIdOf(projectId), id, userId);
  }

  // ---- gallery ------------------------------------------------------------

  @Get('gallery')
  @ApiOperation({ summary: 'The gallery entry published from this project (null if none)' })
  gallery(@Param('projectId', uuid) projectId: string) {
    return this.pm.getGalleryEntry(projectId);
  }

  @Post('gallery')
  @ApiOperation({ summary: 'Publish (or update) this completed project in the Gallery' })
  publish(
    @Param('projectId', uuid) projectId: string,
    @Body() dto: PublishToGalleryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.publishToGallery(projectId, dto, userId);
  }

  @Delete('gallery')
  @ApiOperation({ summary: 'Remove this project from the Gallery' })
  unpublish(
    @Param('projectId', uuid) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.pm.unpublishFromGallery(projectId, userId);
  }
}
