-- AlterTable
ALTER TABLE `gallery` ADD COLUMN `colorsUsed` TEXT NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `materialsUsed` TEXT NULL,
    ADD COLUMN `projectId` VARCHAR(36) NULL;

-- AlterTable
ALTER TABLE `quotation_templates` MODIFY `code` ENUM('TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE') NOT NULL;

-- AlterTable
ALTER TABLE `quotations` ADD COLUMN `advanceRequired` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED') NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE `gallery_photos` (
    `id` VARCHAR(36) NOT NULL,
    `galleryId` VARCHAR(36) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `caption` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `gallery_photos_galleryId_idx`(`galleryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_expenses` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `category` ENUM('MATERIAL', 'LABOUR', 'TRANSPORTATION', 'TOOLS', 'CONTRACTOR', 'ELECTRICITY', 'MISCELLANEOUS') NOT NULL DEFAULT 'MISCELLANEOUS',
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paidBy` VARCHAR(150) NULL,
    `vendor` VARCHAR(200) NULL,
    `paymentMethod` ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER') NULL,
    `notes` TEXT NULL,
    `receiptUrl` VARCHAR(500) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_expenses_projectId_expenseDate_idx`(`projectId`, `expenseDate`),
    INDEX `project_expenses_category_idx`(`category`),
    INDEX `project_expenses_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_materials` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `quotationItemId` VARCHAR(36) NULL,
    `name` VARCHAR(200) NOT NULL,
    `brand` VARCHAR(150) NULL,
    `quantity` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `unit` VARCHAR(30) NOT NULL DEFAULT 'Sq.ft',
    `rate` DECIMAL(12, 2) NULL,
    `description` TEXT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_materials_projectId_idx`(`projectId`),
    INDEX `project_materials_quotationItemId_idx`(`quotationItemId`),
    INDEX `project_materials_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_colors` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `hexCode` VARCHAR(9) NOT NULL,
    `brand` VARCHAR(150) NULL,
    `shadeNumber` VARCHAR(60) NULL,
    `finish` VARCHAR(100) NULL,
    `usedIn` VARCHAR(255) NULL,
    `referenceImageUrl` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_colors_projectId_idx`(`projectId`),
    INDEX `project_colors_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_photos` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `stage` ENUM('BEFORE', 'DURING', 'FINISHED', 'DETAIL', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NULL,
    `caption` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `takenAt` DATETIME(3) NULL,
    `materialId` VARCHAR(36) NULL,
    `colorId` VARCHAR(36) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_photos_projectId_stage_idx`(`projectId`, `stage`),
    INDEX `project_photos_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_activities` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `project_activities_projectId_createdAt_idx`(`projectId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_payments` (
    `id` VARCHAR(36) NOT NULL,
    `quotationId` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NULL,
    `paymentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `method` ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CARD', 'OTHER') NOT NULL DEFAULT 'CASH',
    `referenceNumber` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_payments_quotationId_paymentDate_idx`(`quotationId`, `paymentDate`),
    INDEX `project_payments_projectId_idx`(`projectId`),
    INDEX `project_payments_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `gallery_projectId_key` ON `gallery`(`projectId`);

-- AddForeignKey
ALTER TABLE `gallery` ADD CONSTRAINT `gallery_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery_photos` ADD CONSTRAINT `gallery_photos_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `gallery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_expenses` ADD CONSTRAINT `project_expenses_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_materials` ADD CONSTRAINT `project_materials_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_materials` ADD CONSTRAINT `project_materials_quotationItemId_fkey` FOREIGN KEY (`quotationItemId`) REFERENCES `quotation_items`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_colors` ADD CONSTRAINT `project_colors_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_photos` ADD CONSTRAINT `project_photos_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_photos` ADD CONSTRAINT `project_photos_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `project_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_photos` ADD CONSTRAINT `project_photos_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `project_colors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_activities` ADD CONSTRAINT `project_activities_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_payments` ADD CONSTRAINT `project_payments_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_payments` ADD CONSTRAINT `project_payments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
