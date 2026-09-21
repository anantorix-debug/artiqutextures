import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryTestimonialDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: GalleryStatus })
  @IsOptional()
  @IsEnum(GalleryStatus)
  status?: GalleryStatus;

  @ApiPropertyOptional({
    description: "'true' to only return featured testimonials",
  })
  @IsOptional()
  isFeatured?: string;
}
