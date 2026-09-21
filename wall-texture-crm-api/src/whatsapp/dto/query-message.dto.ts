import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  WhatsAppMessageDirection,
  WhatsAppMessageStatus,
} from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryMessageDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ enum: WhatsAppMessageStatus })
  @IsOptional()
  @IsEnum(WhatsAppMessageStatus)
  status?: WhatsAppMessageStatus;

  @ApiPropertyOptional({ enum: WhatsAppMessageDirection })
  @IsOptional()
  @IsEnum(WhatsAppMessageDirection)
  direction?: WhatsAppMessageDirection;
}
