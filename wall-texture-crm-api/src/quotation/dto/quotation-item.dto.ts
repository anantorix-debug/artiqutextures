import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QuotationItemDto {
  // Every field on a line item is optional — a flat-fee row (e.g. "Site visit charge")
  // may have no product name or measured area, and a placeholder row may be priced later.
  @ApiPropertyOptional({ example: 'PU Wall Texture - Sandstone Finish' })
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '12ft x 10ft' })
  @IsOptional()
  @IsString()
  measurement?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sqft?: number;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;
}
