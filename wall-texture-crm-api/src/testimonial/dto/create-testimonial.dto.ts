import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'Priya Ramesh' })
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @ApiPropertyOptional({
    example: 'Neelankarai villa, 2025',
    description: 'Short attribution line',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({
    example:
      'The team spent a week getting the plaster tone right before touching the wall.',
  })
  @IsNotEmpty()
  @IsString()
  quote: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

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
