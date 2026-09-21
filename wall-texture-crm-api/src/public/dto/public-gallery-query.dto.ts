import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Same shape as QueryGalleryDto minus `status` — the public site can only ever see ACTIVE items. */
export class PublicGalleryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: GalleryType })
  @IsOptional()
  @IsEnum(GalleryType)
  type?: GalleryType;

  @ApiPropertyOptional({ description: "'true' to only return featured images" })
  @IsOptional()
  isFeatured?: string;
}
