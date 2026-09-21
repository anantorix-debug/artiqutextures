/*
  Warnings:

  - You are about to drop the `customer_attachments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_images` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `gallery` ADD COLUMN `subtitle` VARCHAR(255) NULL,
    ADD COLUMN `tags` TEXT NULL,
    ADD COLUMN `type` ENUM('PORTFOLIO', 'DESIGN') NOT NULL DEFAULT 'PORTFOLIO';
-- DropTable
DROP TABLE `customer_attachments`;
-- DropTable
DROP TABLE `project_images`;
-- CreateIndex
CREATE INDEX `gallery_type_idx` ON `gallery`(`type`);
