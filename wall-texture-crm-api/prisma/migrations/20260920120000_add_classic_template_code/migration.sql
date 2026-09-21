-- AlterTable: "Classic" becomes its own template code; TIME_FOR_TEXTURE goes back to the Time For Texture brand template.
ALTER TABLE `quotation_templates` MODIFY `code` ENUM('TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE', 'CLASSIC') NOT NULL;
