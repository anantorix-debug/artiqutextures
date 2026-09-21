import { ApiProperty } from '@nestjs/swagger';
import { QuotationTemplateCode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SwitchTemplateDto {
  @ApiProperty({ enum: QuotationTemplateCode })
  @IsEnum(QuotationTemplateCode)
  templateCode: QuotationTemplateCode;
}
