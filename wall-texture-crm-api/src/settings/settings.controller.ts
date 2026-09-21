import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SettingCategory } from '@prisma/client';
import type { Response } from 'express';
import { SettingsService } from './settings.service';
import { CompanyProfileService } from './company-profile.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { buildMulterOptions, toPublicUrl } from '../shared/utils/multer.config';
import { AppConfig } from '../config/configuration';
import { UpsertSettingsDto } from './dto/upsert-settings.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  private readonly uploadDir: string;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly companyProfile: CompanyProfileService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<AppConfig>('app')!.upload.dir;
  }

  // ---- Company profile (name, contact, logo, quotation defaults) ----------

  @Get('company/profile')
  @ApiOperation({
    summary:
      'Company profile: name, contact, logo URL and quotation defaults (terms, notes, numbering, default template)',
  })
  getCompanyProfile() {
    return this.companyProfile.getProfile();
  }

  @Patch('company/profile')
  @ApiOperation({ summary: 'Update the company profile / quotation defaults' })
  updateCompanyProfile(
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.companyProfile.updateProfile(dto, userId);
  }

  @Post('company/logo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload the company logo (PNG/JPG) — shown on quotation previews, PDFs and print',
  })
  @UseInterceptors(
    FileInterceptor('logo', buildMulterOptions('uploads', 'branding', 'logo')),
  )
  uploadLogo(
    @UploadedFile() logo: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    if (!logo) throw new BadRequestException('A logo file is required');
    return this.companyProfile.setLogo(
      toPublicUrl(this.uploadDir, 'branding', logo.filename),
      userId,
    );
  }

  @Delete('company/logo')
  @ApiOperation({ summary: 'Remove the company logo (documents fall back to a placeholder)' })
  removeLogo(@CurrentUser('id') userId: string) {
    return this.companyProfile.removeLogo(userId);
  }

  @Post('company/logo-tft')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload the Time For Texture (second brand) logo' })
  @UseInterceptors(
    FileInterceptor('logo', buildMulterOptions('uploads', 'branding', 'logo')),
  )
  uploadTftLogo(
    @UploadedFile() logo: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    if (!logo) throw new BadRequestException('A logo file is required');
    return this.companyProfile.setLogo(
      toPublicUrl(this.uploadDir, 'branding', logo.filename),
      userId,
      'tftLogoUrl',
    );
  }

  @Delete('company/logo-tft')
  @ApiOperation({ summary: 'Remove the Time For Texture logo' })
  removeTftLogo(@CurrentUser('id') userId: string) {
    return this.companyProfile.removeLogo(userId, 'tftLogoUrl');
  }

  @Get(':category')
  @ApiParam({ name: 'category', enum: SettingCategory })
  @ApiOperation({
    summary: 'Get all settings for a category (WHATSAPP / SMTP / GENERAL)',
  })
  getByCategory(@Param('category') category: SettingCategory) {
    return this.settingsService.getByCategory(category);
  }

  @Post(':category')
  @ApiParam({ name: 'category', enum: SettingCategory })
  @ApiOperation({ summary: 'Upsert settings for a category' })
  upsert(
    @Param('category') category: SettingCategory,
    @Body() dto: UpsertSettingsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.settingsService.upsertMany(category, dto, userId);
  }

  @Get('audit/logs')
  @ApiOperation({ summary: 'List audit logs with filter & pagination' })
  listAuditLogs(@Query() query: QueryAuditLogDto) {
    return this.settingsService.listAuditLogs(query);
  }

  @Post('backup/run')
  @ApiOperation({ summary: 'Trigger a database backup (mysqldump)' })
  runBackup(@CurrentUser('id') userId: string) {
    return this.settingsService.runBackup(userId);
  }

  @Get('backup/history')
  @ApiOperation({ summary: 'List backup history' })
  listBackups(@Query() query: PaginationQueryDto) {
    return this.settingsService.listBackups(query);
  }

  @Get('backup/:id/download')
  @ApiOperation({ summary: 'Download a database backup file' })
  async downloadBackup(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const backup = await this.settingsService.getBackupFile(id);
    res.download(backup.filePath, backup.fileName);
  }
}
