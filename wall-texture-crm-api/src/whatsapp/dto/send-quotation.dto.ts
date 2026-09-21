import { ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationTemplateCode } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SendQuotationDto {
  @ApiPropertyOptional({
    description: 'Defaults to the customer WhatsApp/phone on file',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    enum: QuotationTemplateCode,
    description: 'Override the quotation default template for this PDF only',
  })
  @IsOptional()
  @IsEnum(QuotationTemplateCode)
  template?: QuotationTemplateCode;
}
