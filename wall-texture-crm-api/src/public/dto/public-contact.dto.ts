import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Fields a website visitor may submit — deliberately a small, safe subset of CreateCustomerDto. */
export class PublicContactDto {
  @ApiProperty({ example: 'Rajesh Kumar' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  customerName: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'rajesh@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Ahmedabad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: '3D wall texture for living room, approx 500 sq.ft',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  requirement?: string;

  @ApiPropertyOptional({ example: 'Neha Joshi' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  referredBy?: string;
}
