import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional({ example: 'Artique Surface Studio' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  companyName?: string;

  @ApiPropertyOptional({ example: 'Premium Decorative Wall Finishes' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  website?: string;

  @ApiPropertyOptional({ description: 'GST / tax registration number' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstNumber?: string;

  @ApiPropertyOptional({ description: 'Default terms pre-filled on new quotations' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  defaultTerms?: string;

  @ApiPropertyOptional({ description: 'Default notes pre-filled on new quotations' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultNotes?: string;

  @ApiPropertyOptional({ example: 'QT', description: 'Prefix for generated quotation numbers, e.g. QT-2026-0001' })
  @IsOptional()
  @Matches(/^[A-Za-z0-9]{1,8}$/, {
    message: 'Prefix must be 1-8 letters/digits',
  })
  quotationPrefix?: string;

  @ApiPropertyOptional({
    enum: ['TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE', 'CLASSIC', 'TFT_CLASSIC', 'TFT_MINIMAL', 'TFT_LUXURY'],
  })
  @IsOptional()
  @IsIn(['TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE', 'CLASSIC', 'TFT_CLASSIC', 'TFT_MINIMAL', 'TFT_LUXURY'])
  defaultTemplateCode?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  defaultValidityDays?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  defaultAdvancePercent?: number;

  // ---- Second brand: Time For Texture ----
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) tftName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) tftTagline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) tftAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) tftPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) tftEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) tftWebsite?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) tftGstNumber?: string;
}
