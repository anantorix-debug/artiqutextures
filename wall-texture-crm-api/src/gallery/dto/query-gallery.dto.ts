import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus, GalleryType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryGalleryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: GalleryStatus })
  @IsOptional()
  @IsEnum(GalleryStatus)
  status?: GalleryStatus;

  @ApiPropertyOptional({ enum: GalleryType })
  @IsOptional()
  @IsEnum(GalleryType)
  type?: GalleryType;

  @ApiPropertyOptional({ description: "'true' to only return featured images" })
  @IsOptional()
  isFeatured?: string;

  @ApiPropertyOptional({ description: "Tag label such as 'Residential' or 'Metallic'" })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: "'true' to only return entries published from completed projects" })
  @IsOptional()
  completedOnly?: string;
}
