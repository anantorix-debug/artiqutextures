-- CreateTable
CREATE TABLE `testimonials` (
    `id` VARCHAR(36) NOT NULL,
    `customerName` VARCHAR(200) NOT NULL,
    `role` VARCHAR(255) NULL,
    `quote` TEXT NOT NULL,
    `rating` TINYINT NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `testimonials_status_idx`(`status`),
    INDEX `testimonials_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
