import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SettingCategory } from '@prisma/client';
import { spawn } from 'child_process';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { AppConfig } from '../config/configuration';
import { SmtpOverride } from '../shared/services/mailer.service';
import { UpsertSettingsDto } from './dto/upsert-settings.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

export interface SettingEntryView {
  key: string;
  value: string | null;
  isSecret: boolean;
  hasValue: boolean;
}

@Injectable()
export class SettingsService {
  private readonly backupDir: string;
  private readonly mysqldumpPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const app = this.configService.get<AppConfig>('app')!;
    this.backupDir = app.backup.dir;
    this.mysqldumpPath = app.backup.mysqldumpPath;
  }

  // ---------------------------------------------------------------------
  // Generic key-value settings (WhatsApp / SMTP / General)
  // ---------------------------------------------------------------------

  async getByCategory(category: SettingCategory): Promise<SettingEntryView[]> {
    const rows = await this.prisma.setting.findMany({
      where: { category, deletedAt: null },
    });
    return rows.map((row) => ({
      key: row.key,
      value: row.isSecret ? null : row.value,
      isSecret: row.isSecret,
      hasValue: !!row.value,
    }));
  }

  async upsertMany(
    category: SettingCategory,
    dto: UpsertSettingsDto,
    userId?: string,
  ) {
    await this.prisma.$transaction(
      dto.entries.map((entry) =>
        this.prisma.setting.upsert({
          where: { category_key: { category, key: entry.key } },
          update: {
            value: entry.value,
            isSecret: entry.isSecret ?? false,
            updatedById: userId,
          },
          create: {
            category,
            key: entry.key,
            value: entry.value,
            isSecret: entry.isSecret ?? false,
            createdById: userId,
            updatedById: userId,
          },
        }),
      ),
    );
    return this.getByCategory(category);
  }

  async getSmtpOverride(): Promise<SmtpOverride | undefined> {
    const rows = await this.prisma.setting.findMany({
      where: { category: 'SMTP', deletedAt: null },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? '']));
    const host = map.get('host');
    const user = map.get('user');
    const password = map.get('password');
    if (!host || !user || !password) return undefined;

    return {
      host,
      port: parseInt(map.get('port') ?? '587', 10),
      secure: map.get('secure') === 'true',
      user,
      password,
      fromName: map.get('fromName') || undefined,
      fromEmail: map.get('fromEmail') || undefined,
    };
  }

  // ---------------------------------------------------------------------
  // Audit Logs
  // ---------------------------------------------------------------------

  async listAuditLogs(query: QueryAuditLogDto): Promise<Paginated<unknown>> {
    const { page, limit, sortBy, sortOrder, userId, action, module } = query;
    const skip = toSkip(page, limit);

    const where: Prisma.AuditLogWhereInput = {
      deletedAt: null,
      ...(userId ? { userId } : {}),
      ...(action ? { action } : {}),
      ...(module ? { module } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  // ---------------------------------------------------------------------
  // Database Backup
  // ---------------------------------------------------------------------

  async runBackup(userId?: string) {
    const db = this.configService.get<AppConfig>('app')!.database;
    const absoluteDir = join(process.cwd(), this.backupDir);
    if (!existsSync(absoluteDir)) mkdirSync(absoluteDir, { recursive: true });

    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filePath = join(absoluteDir, fileName);

    const backupRow = await this.prisma.databaseBackup.create({
      data: { fileName, filePath, status: 'PENDING', createdById: userId },
    });

    const args = ['-h', db.host, '-P', String(db.port), '-u', db.user, db.name];
    const env = {
      ...process.env,
      ...(db.password ? { MYSQL_PWD: db.password } : {}),
    };

    return new Promise((resolve) => {
      const child = spawn(this.mysqldumpPath, args, { env });
      const output = createWriteStream(filePath);
      child.stdout.pipe(output);

      let stderr = '';
      child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));

      child.on('error', async (err) => {
        const updated = await this.prisma.databaseBackup.update({
          where: { id: backupRow.id },
          data: { status: 'FAILED', errorMessage: err.message },
        });
        resolve({ ...updated, fileSize: updated.fileSize?.toString() ?? null });
      });

      child.on('close', async (code) => {
        if (code === 0) {
          const size = existsSync(filePath) ? statSync(filePath).size : 0;
          const updated = await this.prisma.databaseBackup.update({
            where: { id: backupRow.id },
            data: { status: 'SUCCESS', fileSize: BigInt(size) },
          });
          resolve({
            ...updated,
            fileSize: updated.fileSize?.toString() ?? null,
          });
        } else {
          const updated = await this.prisma.databaseBackup.update({
            where: { id: backupRow.id },
            data: {
              status: 'FAILED',
              errorMessage: stderr || `mysqldump exited with code ${code}`,
            },
          });
          resolve({
            ...updated,
            fileSize: updated.fileSize?.toString() ?? null,
          });
        }
      });
    });
  }

  async listBackups(query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const { page, limit, sortBy, sortOrder } = query;
    const skip = toSkip(page, limit);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.databaseBackup.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.databaseBackup.count({ where: { deletedAt: null } }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        fileSize: item.fileSize?.toString() ?? null,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getBackupFile(id: string) {
    const backup = await this.prisma.databaseBackup.findFirst({
      where: { id, deletedAt: null },
    });
    if (!backup) throw new NotFoundException('Backup not found');
    if (!existsSync(backup.filePath)) {
      throw new BadRequestException('Backup file is missing from disk');
    }
    return backup;
  }
}
