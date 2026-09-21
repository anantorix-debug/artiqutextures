import { PartialType } from '@nestjs/swagger';
import { CreateGalleryCategoryDto } from './create-gallery-category.dto';

export class UpdateGalleryCategoryDto extends PartialType(
  CreateGalleryCategoryDto,
) {}
