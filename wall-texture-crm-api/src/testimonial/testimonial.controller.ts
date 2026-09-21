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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { QueryTestimonialDto } from './dto/query-testimonial.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { buildMulterOptions, toPublicUrl } from '../shared/utils/multer.config';
import { AppConfig } from '../config/configuration';

@ApiTags('Testimonials')
@ApiBearerAuth()
@Controller('testimonials')
export class TestimonialController {
  private readonly uploadDir: string;

  constructor(
    private readonly testimonialService: TestimonialService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<AppConfig>('app')!.upload.dir;
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a testimonial (avatar photo optional)' })
  @UseInterceptors(
    FileInterceptor(
      'avatar',
      buildMulterOptions('uploads', 'testimonials', 'image'),
    ),
  )
  create(
    @Body() dto: CreateTestimonialDto,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    const avatarUrl = avatar
      ? toPublicUrl(this.uploadDir, 'testimonials', avatar.filename)
      : undefined;
    return this.testimonialService.create(dto, avatarUrl, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List testimonials with filter & pagination' })
  findAll(@Query() query: QueryTestimonialDto) {
    return this.testimonialService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single testimonial' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testimonialService.findOne(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a testimonial (optionally replace avatar)' })
  @UseInterceptors(
    FileInterceptor(
      'avatar',
      buildMulterOptions('uploads', 'testimonials', 'image'),
    ),
  )
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTestimonialDto,
    @UploadedFile() avatar: Express.Multer.File | undefined,
    @CurrentUser('id') userId: string,
  ) {
    const avatarUrl = avatar
      ? toPublicUrl(this.uploadDir, 'testimonials', avatar.filename)
      : undefined;
    return this.testimonialService.update(id, dto, avatarUrl, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a testimonial' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.testimonialService.remove(id, userId);
  }
}
