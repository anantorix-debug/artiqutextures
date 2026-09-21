import { BadRequestException } from '@nestjs/common';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|webp|gif)$/i;
const ALLOWED_DOCUMENT_TYPES = /\.(pdf|doc|docx|xls|xlsx)$/i;
// pdfmake can only embed PNG/JPEG, so the company logo is restricted to those.
const ALLOWED_LOGO_TYPES = /\.(png|jpe?g)$/i;
// Project photos: JPG, JPEG, PNG and WEBP only.
const ALLOWED_PHOTO_TYPES = /\.(jpe?g|png|webp)$/i;
// Expense receipts may also be a PDF.
const ALLOWED_RECEIPT_TYPES = /\.(jpe?g|png|webp|pdf)$/i;

export type UploadKind =
  | 'image'
  | 'document'
  | 'any'
  | 'logo'
  | 'photo'
  | 'receipt';

function buildFileFilter(kind: UploadKind) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, accept: boolean) => void,
  ) => {
    if (kind === 'logo' && !ALLOWED_LOGO_TYPES.test(file.originalname)) {
      return callback(
        new BadRequestException('Logo must be a PNG or JPG image'),
        false,
      );
    }
    if (kind === 'photo' && !ALLOWED_PHOTO_TYPES.test(file.originalname)) {
      return callback(
        new BadRequestException(
          'Only JPG, JPEG, PNG and WEBP images are allowed',
        ),
        false,
      );
    }
    if (kind === 'receipt' && !ALLOWED_RECEIPT_TYPES.test(file.originalname)) {
      return callback(
        new BadRequestException(
          'Receipt must be an image (JPG/PNG/WEBP) or a PDF',
        ),
        false,
      );
    }
    if (kind === 'image' && !ALLOWED_IMAGE_TYPES.test(file.originalname)) {
      return callback(
        new BadRequestException('Only image files are allowed'),
        false,
      );
    }
    if (
      kind === 'document' &&
      !ALLOWED_DOCUMENT_TYPES.test(file.originalname) &&
      !ALLOWED_IMAGE_TYPES.test(file.originalname)
    ) {
      return callback(
        new BadRequestException('Only document/image files are allowed'),
        false,
      );
    }
    callback(null, true);
  };
}

/** Persists the upload to disk under uploads/<subfolder> — for files that need to be viewable later. */
export function buildMulterOptions(
  uploadRootDir: string,
  subfolder: string,
  kind: UploadKind = 'any',
) {
  const destination = join(process.cwd(), uploadRootDir, subfolder);
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination,
      filename: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, filename: string) => void,
      ) => {
        const uniqueName = `${Date.now()}-${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        callback(null, uniqueName);
      },
    }),
    fileFilter: buildFileFilter(kind),
    limits: { fileSize: 15 * 1024 * 1024 },
  };
}

/**
 * Keeps the upload in memory only (`file.buffer`) — nothing is written to
 * disk. For transient sends (e.g. WhatsApp media) that don't need to be
 * retrievable afterward, so we don't accumulate duplicate copies on disk of
 * something already delivered to the recipient.
 */
export function buildMemoryMulterOptions(kind: UploadKind = 'any') {
  return {
    storage: memoryStorage(),
    fileFilter: buildFileFilter(kind),
  };
}

export function toPublicUrl(
  uploadRootDir: string,
  subfolder: string,
  filename: string,
): string {
  return `/${uploadRootDir}/${subfolder}/${filename}`.replace(/\\/g, '/');
}
