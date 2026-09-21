-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatarUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `passwordResetToken` VARCHAR(255) NULL,
    `passwordResetExpiresAt` DATETIME(3) NULL,
    `refreshTokenHash` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` VARCHAR(36) NOT NULL,
    `customerName` VARCHAR(150) NOT NULL,
    `companyName` VARCHAR(150) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `whatsapp` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `gstNumber` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `pinCode` VARCHAR(10) NULL,
    `leadSource` ENUM('WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'WALK_IN', 'PHONE_CALL', 'ADVERTISEMENT', 'EXHIBITION', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `requirement` TEXT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `status` ENUM('NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_DONE', 'QUOTATION_SENT', 'NEGOTIATION', 'WON', 'LOST', 'ON_HOLD') NOT NULL DEFAULT 'NEW',
    `followUpDate` DATETIME(3) NULL,
    `siteVisitDate` DATETIME(3) NULL,
    `remarks` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `customers_status_idx`(`status`),
    INDEX `customers_priority_idx`(`priority`),
    INDEX `customers_leadSource_idx`(`leadSource`),
    INDEX `customers_followUpDate_idx`(`followUpDate`),
    INDEX `customers_siteVisitDate_idx`(`siteVisitDate`),
    INDEX `customers_phone_idx`(`phone`),
    INDEX `customers_customerName_idx`(`customerName`),
    INDEX `customers_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_activities` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `type` ENUM('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'SITE_VISIT', 'FOLLOW_UP', 'STATUS_CHANGE', 'QUOTATION', 'MEETING', 'OTHER') NOT NULL DEFAULT 'NOTE',
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `activityDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `customer_activities_customerId_idx`(`customerId`),
    INDEX `customer_activities_type_idx`(`type`),
    INDEX `customer_activities_activityDate_idx`(`activityDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_attachments` (
    `id` VARCHAR(36) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileType` VARCHAR(100) NULL,
    `fileSize` INTEGER NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `customer_attachments_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_templates` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` ENUM('TIME_FOR_TEXTURE', 'ARTIQUE_SURFACE') NOT NULL,
    `description` TEXT NULL,
    `previewImageUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `quotation_templates_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` VARCHAR(36) NOT NULL,
    `quotationNumber` VARCHAR(50) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `projectName` VARCHAR(200) NOT NULL,
    `templateId` VARCHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONVERTED') NOT NULL DEFAULT 'DRAFT',
    `quotationDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NULL,
    `subTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discountType` ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
    `discountValue` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `discountAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `gstEnabled` BOOLEAN NOT NULL DEFAULT false,
    `gstPercentage` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `gstAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `transportationCharges` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `installationCharges` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `additionalCharges` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grandTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `termsConditions` TEXT NULL,
    `notes` TEXT NULL,
    `signatureUrl` VARCHAR(500) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `rootQuotationId` VARCHAR(36) NULL,
    `approvedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(36) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(36) NULL,
    `rejectionReason` TEXT NULL,
    `convertedToProjectAt` DATETIME(3) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `quotations_quotationNumber_key`(`quotationNumber`),
    INDEX `quotations_customerId_idx`(`customerId`),
    INDEX `quotations_templateId_idx`(`templateId`),
    INDEX `quotations_status_idx`(`status`),
    INDEX `quotations_quotationNumber_idx`(`quotationNumber`),
    INDEX `quotations_rootQuotationId_idx`(`rootQuotationId`),
    INDEX `quotations_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_items` (
    `id` VARCHAR(36) NOT NULL,
    `quotationId` VARCHAR(36) NOT NULL,
    `srNo` INTEGER NOT NULL DEFAULT 1,
    `productName` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `measurement` VARCHAR(150) NULL,
    `sqft` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `rate` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `quotation_items_quotationId_idx`(`quotationId`),
    INDEX `quotation_items_productName_idx`(`productName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_revisions` (
    `id` VARCHAR(36) NOT NULL,
    `quotationId` VARCHAR(36) NOT NULL,
    `versionNumber` INTEGER NOT NULL,
    `snapshot` JSON NOT NULL,
    `changeNote` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `quotation_revisions_quotationId_idx`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_tracking` (
    `id` VARCHAR(36) NOT NULL,
    `projectName` VARCHAR(200) NOT NULL,
    `customerId` VARCHAR(36) NOT NULL,
    `quotationId` VARCHAR(36) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `expectedCompletionDate` DATETIME(3) NULL,
    `actualCompletionDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `assignedTeam` VARCHAR(255) NULL,
    `progressPercentage` INTEGER NOT NULL DEFAULT 0,
    `currentStage` VARCHAR(150) NULL,
    `remarks` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `project_tracking_quotationId_key`(`quotationId`),
    INDEX `project_tracking_customerId_idx`(`customerId`),
    INDEX `project_tracking_status_idx`(`status`),
    INDEX `project_tracking_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_images` (
    `id` VARCHAR(36) NOT NULL,
    `projectId` VARCHAR(36) NOT NULL,
    `type` ENUM('BEFORE', 'PROGRESS', 'AFTER') NOT NULL DEFAULT 'PROGRESS',
    `imageUrl` VARCHAR(500) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `caption` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `project_images_projectId_idx`(`projectId`),
    INDEX `project_images_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `gallery_categories_name_key`(`name`),
    UNIQUE INDEX `gallery_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `categoryId` VARCHAR(36) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `gallery_categoryId_idx`(`categoryId`),
    INDEX `gallery_status_idx`(`status`),
    INDEX `gallery_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `sessionName` VARCHAR(100) NOT NULL,
    `status` ENUM('DISCONNECTED', 'INITIALIZING', 'QR_PENDING', 'CONNECTED', 'AUTH_FAILED') NOT NULL DEFAULT 'DISCONNECTED',
    `phoneNumber` VARCHAR(20) NULL,
    `qrCode` TEXT NULL,
    `isConnected` BOOLEAN NOT NULL DEFAULT false,
    `lastConnectedAt` DATETIME(3) NULL,
    `lastDisconnectedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `whatsapp_sessions_sessionName_key`(`sessionName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_messages` (
    `id` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NULL,
    `customerId` VARCHAR(36) NULL,
    `quotationId` VARCHAR(36) NULL,
    `galleryId` VARCHAR(36) NULL,
    `direction` ENUM('OUTBOUND', 'INBOUND') NOT NULL DEFAULT 'OUTBOUND',
    `type` ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'QUOTATION_PDF', 'GALLERY_IMAGE') NOT NULL DEFAULT 'TEXT',
    `toNumber` VARCHAR(20) NULL,
    `fromNumber` VARCHAR(20) NULL,
    `content` TEXT NULL,
    `mediaUrl` VARCHAR(500) NULL,
    `fileName` VARCHAR(255) NULL,
    `status` ENUM('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'QUEUED',
    `providerMessageId` VARCHAR(150) NULL,
    `errorMessage` TEXT NULL,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `whatsapp_messages_sessionId_idx`(`sessionId`),
    INDEX `whatsapp_messages_customerId_idx`(`customerId`),
    INDEX `whatsapp_messages_quotationId_idx`(`quotationId`),
    INDEX `whatsapp_messages_galleryId_idx`(`galleryId`),
    INDEX `whatsapp_messages_status_idx`(`status`),
    INDEX `whatsapp_messages_direction_idx`(`direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `type` ENUM('LEAD_FOLLOWUP', 'QUOTATION_REMINDER', 'PROJECT_STATUS', 'WHATSAPP_ALERT', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(500) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settings` (
    `id` VARCHAR(36) NOT NULL,
    `category` ENUM('WHATSAPP', 'SMTP', 'GENERAL') NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NULL,
    `isSecret` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `settings_category_idx`(`category`),
    UNIQUE INDEX `settings_category_key_key`(`category`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `database_backups` (
    `id` VARCHAR(36) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `fileSize` BIGINT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `errorMessage` TEXT NULL,
    `createdById` VARCHAR(36) NULL,
    `updatedById` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `database_backups_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'RESTORE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `module` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(100) NULL,
    `entityId` VARCHAR(36) NULL,
    `description` TEXT NULL,
    `oldValues` JSON NULL,
    `newValues` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_module_idx`(`module`),
    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `customer_activities` ADD CONSTRAINT `customer_activities_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_attachments` ADD CONSTRAINT `customer_attachments_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `quotation_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_items` ADD CONSTRAINT `quotation_items_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotation_revisions` ADD CONSTRAINT `quotation_revisions_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tracking` ADD CONSTRAINT `project_tracking_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tracking` ADD CONSTRAINT `project_tracking_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_images` ADD CONSTRAINT `project_images_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `project_tracking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gallery` ADD CONSTRAINT `gallery_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `gallery_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `whatsapp_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `whatsapp_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `whatsapp_messages_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `whatsapp_messages_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_messages` ADD CONSTRAINT `whatsapp_messages_galleryId_fkey` FOREIGN KEY (`galleryId`) REFERENCES `gallery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
