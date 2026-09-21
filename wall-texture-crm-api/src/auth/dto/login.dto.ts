import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@walltextures.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ChangeMe@123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
