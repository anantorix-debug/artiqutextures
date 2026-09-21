import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { CreateGalleryCategoryDto } from './dto/create-gallery-category.dto';
import { UpdateGalleryCategoryDto } from './dto/update-gallery-category.dto';
import { CreateGalleryDto } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { buildMulterOptions, toPublicUrl } from '../shared/utils/multer.config';
import { AppConfig } from '../config/configuration';

type UploadedFilesMap = {
  image?: Express.Multer.File[];
  thumbnail?: Express.Multer.File[];
};

@ApiTags('Gallery')
@ApiBearerAuth()
@Controller('gallery')
export class GalleryController {
  private readonly uploadDir: string;

  constructor(
    private readonly galleryService: GalleryService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<AppConfig>('app')!.upload.dir;
  }

  // ---------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------

  @Post('categories')
  @ApiOperation({ summary: 'Create a gallery category' })
  createCategory(
    @Body() dto: CreateGalleryCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.createCategory(dto, userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List gallery categories' })
  findAllCategories() {
    return this.galleryService.findAllCategories();
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a gallery category' })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryCategoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.updateCategory(id, dto, userId);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a gallery category (must be empty)' })
  removeCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.removeCategory(id, userId);
  }

  // ---------------------------------------------------------------------
  // Gallery Images
  // ---------------------------------------------------------------------

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a new gallery image (with optional thumbnail)',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      buildMulterOptions('uploads', 'gallery', 'image'),
    ),
  )
  create(
    @Body() dto: CreateGalleryDto,
    @UploadedFiles() files: UploadedFilesMap,
    @CurrentUser('id') userId: string,
  ) {
    const imageFile = files.image?.[0];
    if (!imageFile) {
      throw new Error('An image file is required');
    }
    const imageUrl = toPublicUrl(this.uploadDir, 'gallery', imageFile.filename);
    const thumbnailUrl = files.thumbnail?.[0]
      ? toPublicUrl(this.uploadDir, 'gallery', files.thumbnail[0].filename)
      : undefined;
    return this.galleryService.create(dto, imageUrl, thumbnailUrl, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List gallery images with filter & pagination' })
  findAll(@Query() query: QueryGalleryDto) {
    return this.galleryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single gallery image' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.galleryService.findOne(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update a gallery image (optionally replace files)',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      buildMulterOptions('uploads', 'gallery', 'image'),
    ),
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryDto,
    @UploadedFiles() files: UploadedFilesMap,
    @CurrentUser('id') userId: string,
  ) {
    const imageUrl = files.image?.[0]
      ? toPublicUrl(this.uploadDir, 'gallery', files.image[0].filename)
      : undefined;
    const thumbnailUrl = files.thumbnail?.[0]
      ? toPublicUrl(this.uploadDir, 'gallery', files.thumbnail[0].filename)
      : undefined;
    return this.galleryService.update(id, dto, imageUrl, thumbnailUrl, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gallery image' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.galleryService.remove(id, userId);
  }
}
