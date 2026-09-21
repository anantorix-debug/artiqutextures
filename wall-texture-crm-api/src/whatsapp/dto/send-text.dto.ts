import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendTextDto {
  @ApiPropertyOptional({
    description: 'Existing customer to link this message to',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Required if customerId is not provided',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'Hi! Thank you for your enquiry, our team will visit you soon.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}
