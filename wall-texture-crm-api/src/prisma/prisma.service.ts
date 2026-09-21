import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Central Prisma access point. Registered as a global module so every
 * feature module can inject it without re-importing PrismaModule.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to MySQL database via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Soft delete helper — every core table carries a `deletedAt` column,
   * so callers use this instead of Prisma's hard `delete`.
   */
  async softDelete<T>(
    model: {
      update: (args: {
        where: { id: string };
        data: { deletedAt: Date; updatedById?: string | null };
      }) => Promise<T>;
    },
    id: string,
    updatedById?: string,
  ): Promise<T> {
    return model.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: updatedById ?? null },
    });
  }
}
