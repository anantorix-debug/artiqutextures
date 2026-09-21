import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendGalleryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;
}
