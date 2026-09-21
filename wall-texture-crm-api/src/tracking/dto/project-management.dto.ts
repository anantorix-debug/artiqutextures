import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ExpenseCategory, PaymentMethod, PhotoStage } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/** Multipart form fields arrive as strings; empty string means "not provided". */
const emptyToUndefined = () =>
  Transform(({ value }) => (value === '' || value === 'null' ? undefined : value));

// ---------------------------------------------------------------- Expenses

export class CreateExpenseDto {
  @ApiPropertyOptional({ description: 'Defaults to today' })
  @emptyToUndefined()
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  description: string;

  @ApiProperty({ example: 4500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  paidBy?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  vendor?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @emptyToUndefined()
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Set "true" to remove the stored receipt (PATCH only)' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  removeReceipt?: boolean;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

export class QueryExpenseDto {
  @ApiPropertyOptional({ enum: ExpenseCategory })
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

// --------------------------------------------------------------- Materials

export class CreateMaterialDto {
  @ApiProperty({ example: 'Metallic Accent Coating' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @ApiProperty({ example: 280 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 'Sq.ft' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ description: 'Cost per unit, if applicable' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Quotation line this material fulfils' })
  @IsOptional()
  @IsUUID()
  quotationItemId?: string;
}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}

export class ImportMaterialsDto {
  @ApiPropertyOptional({
    type: [String],
    description: 'Quotation item ids to import; omit to import every item not yet linked',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  quotationItemIds?: string[];
}

// ------------------------------------------------------------------ Colors

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class CreateColorDto {
  @ApiProperty({ example: 'Antique Gold' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: '#B27608' })
  @Matches(HEX, { message: 'hexCode must be a valid HEX colour like #B27608' })
  hexCode: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  brand?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  shadeNumber?: string;

  @ApiPropertyOptional({ example: 'Matte' })
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  finish?: string;

  @ApiPropertyOptional({ example: 'Living room accent wall' })
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  usedIn?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Set "true" to remove the reference image (PATCH only)' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  removeReferenceImage?: boolean;
}

export class UpdateColorDto extends PartialType(CreateColorDto) {}

// ------------------------------------------------------------------ Photos

export class UploadPhotosDto {
  @ApiPropertyOptional({ enum: PhotoStage, default: PhotoStage.OTHER })
  @emptyToUndefined()
  @IsOptional()
  @IsEnum(PhotoStage)
  stage?: PhotoStage;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Date the photo was taken' })
  @emptyToUndefined()
  @IsOptional()
  @IsDateString()
  takenAt?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsUUID()
  materialId?: string;

  @ApiPropertyOptional()
  @emptyToUndefined()
  @IsOptional()
  @IsUUID()
  colorId?: string;
}

export class UpdatePhotoDto extends UploadPhotosDto {}

// ----------------------------------------------------------------- Gallery

export class PublishToGalleryDto {
  @ApiProperty({ type: [String], description: 'Project photo ids to show in the gallery' })
  @IsArray()
  @IsUUID('all', { each: true })
  photoIds: string[];

  @ApiPropertyOptional({ description: 'Defaults to the project name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Defaults to a summary built from the project' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Residential, Interior, Metallic' })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum({ ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' })
  status?: 'ACTIVE' | 'INACTIVE';
}
