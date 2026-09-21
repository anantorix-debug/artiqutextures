import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationTemplateCode, DiscountType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuotationItemDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @ApiProperty({ description: 'Customer/Lead this quotation is for' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Living Room 3D Wall Texture' })
  @IsNotEmpty()
  @IsString()
  projectName: string;

  @ApiPropertyOptional({
    enum: QuotationTemplateCode,
    default: QuotationTemplateCode.ARTIQUE_SURFACE,
  })
  @IsOptional()
  @IsEnum(QuotationTemplateCode)
  templateCode?: QuotationTemplateCode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  quotationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];

  @ApiPropertyOptional({ enum: DiscountType, default: DiscountType.PERCENTAGE })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  gstEnabled?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  gstPercentage?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportationCharges?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  installationCharges?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalCharges?: number;

  @ApiPropertyOptional({
    description:
      'Advance the customer must pay to confirm. Defaults to the company default % of the grand total.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceRequired?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
