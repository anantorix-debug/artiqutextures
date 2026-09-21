import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { AppConfig } from '../../config/configuration';

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<AppConfig>('app')!.upload.dir;
  }

  /** Deletes a previously uploaded file given its public URL (e.g. /uploads/gallery/xyz.jpg). */
  deleteByPublicUrl(publicUrl?: string | null): void {
    if (!publicUrl) return;
    const relative = publicUrl.replace(/^\//, '');
    const absolute = join(process.cwd(), relative);
    if (absolute.includes(this.uploadDir) && existsSync(absolute)) {
      try {
        unlinkSync(absolute);
      } catch (err) {
        this.logger.warn(
          `Could not delete file ${absolute}: ${(err as Error).message}`,
        );
      }
    }
  }
}
