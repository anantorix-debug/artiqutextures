import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectQuotationDto {
  @ApiProperty({
    example: 'Customer found the price too high for the requested area',
  })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}
