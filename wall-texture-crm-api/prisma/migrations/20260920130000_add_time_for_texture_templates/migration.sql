-- AlterTable: four templates per brand (Time For Texture gets three more layouts)
ALTER TABLE `quotation_templates` MODIFY `code` ENUM('TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE', 'CLASSIC', 'TFT_CLASSIC', 'TFT_MINIMAL', 'TFT_LUXURY') NOT NULL;
