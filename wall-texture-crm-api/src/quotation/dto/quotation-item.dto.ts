import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QuotationItemDto {
  @ApiProperty({ example: 'PU Wall Texture - Sandstone Finish' })
  @IsNotEmpty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '12ft x 10ft' })
  @IsOptional()
  @IsString()
  measurement?: string;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(0)
  sqft: number;

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  rate: number;
}
