import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappClientService } from './whatsapp-client.service';
import { WHATSAPP_QUEUE, WhatsappJobPayload } from './whatsapp-job.interface';

/**
 * Consumes queued outgoing WhatsApp messages so API requests never block on
 * a WhatsApp send. Each job corresponds to a pre-created `whatsapp_messages`
 * row (status QUEUED) that this processor updates once the send resolves.
 *
 * `limiter` deliberately throttles this to one message every 4 seconds
 * (concurrency: 1 + rate limit) — this is a single personal WhatsApp
 * account, not a bulk-messaging platform. Sending many messages back-to-back
 * is exactly the pattern WhatsApp's spam/ban detection flags. There is no
 * "send to all leads" style bulk endpoint anywhere in this app; every send
 * still goes through this same throttled queue no matter how many are queued.
 */
@Processor(WHATSAPP_QUEUE, {
  concurrency: 1,
  limiter: { max: 1, duration: 4000 },
})
export class WhatsappQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappQueueProcessor.name);

  constructor(
    private readonly whatsappClient: WhatsappClientService,
    private readonly prisma: PrismaService,
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
