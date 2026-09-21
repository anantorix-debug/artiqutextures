-- AlterTable
ALTER TABLE `customers` ADD COLUMN `referredBy` VARCHAR(150) NULL;

-- NOTE: this migration originally re-added foreign keys that the init migration already
-- creates. That only "worked" on MyISAM databases (which ignore foreign keys); on InnoDB it
-- fails with "Duplicate foreign key constraint name". The duplicate statements were removed.
