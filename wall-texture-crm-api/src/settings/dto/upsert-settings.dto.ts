import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SettingEntryDto {
  @ApiProperty({ example: 'host' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'smtp.gmail.com' })
  @IsString()
  value: string;

  @ApiProperty({
    required: false,
    description: 'Mask this value in GET responses (e.g. passwords)',
  })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
}

export class UpsertSettingsDto {
  @ApiProperty({ type: [SettingEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettingEntryDto)
  entries: SettingEntryDto[];
}
