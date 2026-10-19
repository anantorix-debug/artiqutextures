-- CreateTable
CREATE TABLE `proforma_invoices` (
    `id` VARCHAR(36) NOT NULL,
    `invoiceNumber` VARCHAR(50) NOT NULL,
    `quotationId` VARCHAR(36) NOT NULL,
    `templateCode` ENUM('TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE', 'MODERN_MINIMAL', 'LUXURY_TEXTURE', 'CLASSIC', 'TFT_CLASSIC', 'TFT_MINIMAL', 'TFT_LUXURY') NOT NULL,
    `snapshot` JSON NOT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `proforma_invoices_invoiceNumber_key`(`invoiceNumber`),
    INDEX `proforma_invoices_quotationId_idx`(`quotationId`),
    INDEX `proforma_invoices_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `proforma_invoices` ADD CONSTRAINT `proforma_invoices_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
