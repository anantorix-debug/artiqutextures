import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/configuration';
import { WhatsappClientService } from './whatsapp-client.service';
import { WHATSAPP_QUEUE, WhatsappJobPayload } from './whatsapp-job.interface';

// BullMQ's @Processor options are evaluated once, when this class is declared —
// before Nest's DI container (and ConfigService) exists — so these read straight
// from process.env rather than via the injected ConfigService used elsewhere below.
const MIN_DELAY_SECONDS = parseInt(
  process.env.WHATSAPP_MIN_DELAY_SECONDS ?? '4',
  10,
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Consumes queued outgoing WhatsApp messages so API requests never block on
 * a WhatsApp send. Each job corresponds to a pre-created `whatsapp_messages`
 * row (status QUEUED) that this processor updates once the send resolves.
 *
 * `limiter` throttles this to one message at most every `MIN_DELAY_SECONDS`
 * (concurrency: 1 + rate limit) — this is a single personal WhatsApp account,
 * not a bulk-messaging platform. On top of that, `process()` adds a random
 * jitter delay before every send: a perfectly periodic gap (exactly N seconds,
 * every time) is itself a recognisable automation fingerprint, so the actual
 * spacing between sends varies. There is no "send to all leads" style bulk
 * endpoint anywhere in this app, and `WhatsappService.assertDailyLimitNotExceeded`
 * caps total volume per day — every send still goes through this same
 * throttled, capped queue no matter how many are requested.
 */
@Processor(WHATSAPP_QUEUE, {
  concurrency: 1,
  limiter: { max: 1, duration: MIN_DELAY_SECONDS * 1000 },
})
export class WhatsappQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappQueueProcessor.name);

  constructor(
    private readonly whatsappClient: WhatsappClientService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<WhatsappJobPayload>): Promise<void> {
    const {
      messageId,
      toNumber,
      type,
      content,
      mediaBase64,
      mediaMimeType,
      fileName,
    } = job.data;

    const maxJitterSeconds =
      this.configService.get<AppConfig>('app')!.whatsapp.maxJitterSeconds;
    if (maxJitterSeconds > 0) {
      await sleep(Math.random() * maxJitterSeconds * 1000);
    }

    const result =
      type === 'TEXT'
        ? await this.whatsappClient.sendText(toNumber, content ?? '')
        : await this.whatsappClient.sendMedia(
            toNumber,
            mediaBase64 ?? '',
            mediaMimeType ?? 'application/octet-stream',
            fileName ?? 'file',
            content,
          );

    await this.prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: result.success
        ? {
            status: 'SENT',
            providerMessageId: result.providerMessageId,
            sentAt: new Date(),
          }
        : { status: 'FAILED', errorMessage: result.errorMessage },
    });

    if (!result.success) {
      this.logger.warn(
        `Message ${messageId} to ${toNumber} failed: ${result.errorMessage}`,
      );
      throw new Error(result.errorMessage ?? 'Failed to send WhatsApp message');
    }
  }
}
