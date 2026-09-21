import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received via email' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewSecurePass@123' })
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
