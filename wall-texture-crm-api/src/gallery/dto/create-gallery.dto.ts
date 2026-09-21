import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus, GalleryType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateGalleryDto {
  @ApiProperty({ example: '3D Textured Living Room Wall' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    enum: GalleryType,
    default: GalleryType.PORTFOLIO,
    description:
      'PORTFOLIO = a completed project (recent work); DESIGN = a texture/material catalog entry',
  })
  @IsOptional()
  @IsEnum(GalleryType)
  type?: GalleryType;

  @ApiPropertyOptional({
    description: 'Required for DESIGN entries (the catalog category). Not used for PORTFOLIO — one project isn\'t a catalog item.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Roman clay, 4 rooms · 2025',
    description: 'Short secondary line shown under the title',
  })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({
    example: 'Teak, White Oak, Ash',
    description:
      'Comma-separated material/texture tags (e.g. for a Design entry)',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: GalleryStatus, default: GalleryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GalleryStatus)
  status?: GalleryStatus;
}
