import {
  BadRequestException,
  ServiceUnavailableException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, QuotationTemplateCode } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationService } from '../quotation/quotation.service';
import {
  buildPaginationMeta,
  Paginated,
} from '../common/utils/pagination.util';
import { toSkip } from '../common/dto/pagination-query.dto';
import { WHATSAPP_QUEUE, WhatsappJobPayload } from './whatsapp-job.interface';
import { WhatsappClientService } from './whatsapp-client.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendMediaDto } from './dto/send-media.dto';
import { SendQuotationDto } from './dto/send-quotation.dto';
import { SendGalleryDto } from './dto/send-gallery.dto';
import { QueryMessageDto } from './dto/query-message.dto';

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

@Injectable()
export class WhatsappService {
  constructor(
    @InjectQueue(WHATSAPP_QUEUE)
    private readonly whatsappQueue: Queue<WhatsappJobPayload>,
    private readonly prisma: PrismaService,
    private readonly quotationService: QuotationService,
    private readonly whatsappClient: WhatsappClientService,
  ) {}

  async getStatus() {
    const session = await this.prisma.whatsAppSession.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    return (
      session ?? {
        status: 'DISCONNECTED',
        isConnected: false,
        phoneNumber: null,
        qrCode: null,
      }
    );
  }

  async initialize() {
    void this.whatsappClient.initialize();
    return {
      message:
        'Initialization started — poll GET /whatsapp/status for the QR code',
    };
  }

  async logout() {
    await this.whatsappClient.logout();
    return { message: 'Logged out' };
  }

  private async resolvePhone(
    customerId?: string,
    phone?: string,
  ): Promise<{ phone: string; customerId?: string }> {
    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });
      if (!customer) throw new NotFoundException('Customer not found');
      return { phone: customer.whatsapp || customer.phone, customerId };
    }
    if (!phone)
      throw new BadRequestException('Either customerId or phone is required');
    return { phone };
  }

  async sendText(dto: SendTextDto, userId?: string) {
    const { phone, customerId } = await this.resolvePhone(
      dto.customerId,
      dto.phone,
    );

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        customerId,
        direction: 'OUTBOUND',
        type: 'TEXT',
        toNumber: phone,
        content: dto.content,
        status: 'QUEUED',
        createdById: userId,
      },
    });

    await this.enqueue({
      messageId: message.id,
      toNumber: phone,
      type: 'TEXT',
      content: dto.content,
    });

    return message;
  }

  /**
   * `file` comes from memory-storage multer (see WhatsappController) — the
   * upload is never written to disk. It's converted to base64, queued for
   * delivery, and the buffer is discarded once this request completes; only
   * the message metadata (not the media itself) is kept in `whatsapp_messages`.
   */
  async sendMedia(
    dto: SendMediaDto,
    file: Express.Multer.File,
    kind: 'IMAGE' | 'DOCUMENT',
    userId?: string,
  ) {
    const { phone, customerId } = await this.resolvePhone(
      dto.customerId,
      dto.phone,
    );
    const base64Data = file.buffer.toString('base64');

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        customerId,
        direction: 'OUTBOUND',
        type: kind,
        toNumber: phone,
        content: dto.caption,
        fileName: file.originalname,
        status: 'QUEUED',
        createdById: userId,
      },
    });

    await this.enqueue({
      messageId: message.id,
      toNumber: phone,
      type: kind,
      content: dto.caption,
      mediaBase64: base64Data,
      mediaMimeType: file.mimetype,
      fileName: file.originalname,
    });

    return message;
  }

  /**
   * Adds a send job to the Redis-backed queue. Without a reachable Redis,
   * BullMQ waits forever — so fail fast with a clear error and mark the
   * message FAILED instead of leaving the UI spinning.
   */
  private async enqueue(payload: WhatsappJobPayload) {
    const timeoutMs = 8000;
    try {
      await Promise.race([
        this.whatsappQueue.add('send', payload),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('queue timeout')), timeoutMs),
        ),
      ]);
    } catch {
      await this.prisma.whatsAppMessage
        .update({
          where: { id: payload.messageId },
          data: {
            status: 'FAILED',
            errorMessage: 'Message queue (Redis) is not reachable',
          },
        })
        .catch(() => undefined);
      throw new ServiceUnavailableException(
        'WhatsApp queue is unavailable — start Redis (docker compose up -d redis) and try again.',
      );
    }
  }

  async sendQuotationPdf(
    quotationId: string,
    dto: SendQuotationDto,
    userId?: string,
  ) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, deletedAt: null },
      include: { customer: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const phone =
      dto.phone || quotation.customer.whatsapp || quotation.customer.phone;
    const templateOverride: QuotationTemplateCode | undefined = dto.template;
    const buffer = await this.quotationService.generatePdf(
      quotationId,
      templateOverride,
    );
    const fileName = `${quotation.quotationNumber}.pdf`;

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        customerId: quotation.customerId,
        quotationId: quotation.id,
        direction: 'OUTBOUND',
        type: 'QUOTATION_PDF',
        toNumber: phone,
        content: `Quotation ${quotation.quotationNumber}`,
        fileName,
        status: 'QUEUED',
        createdById: userId,
      },
    });

    await this.enqueue({
      messageId: message.id,
      toNumber: phone,
      type: 'QUOTATION_PDF',
      content: `Please find attached your quotation ${quotation.quotationNumber}.`,
      mediaBase64: buffer.toString('base64'),
      mediaMimeType: 'application/pdf',
      fileName,
    });

    return message;
  }

  async sendGalleryImage(
    galleryId: string,
    dto: SendGalleryDto,
    userId?: string,
    options?: { customerId?: string; caption?: string },
  ) {
    const gallery = await this.prisma.gallery.findFirst({
      where: { id: galleryId, deletedAt: null },
    });
    if (!gallery) throw new NotFoundException('Gallery image not found');

    const absolutePath = join(
      process.cwd(),
      gallery.imageUrl.replace(/^\//, ''),
    );
    if (!existsSync(absolutePath)) {
      throw new BadRequestException('Gallery image file is missing from disk');
    }

    const ext = extname(absolutePath).toLowerCase();
    const mimeType = IMAGE_MIME_BY_EXT[ext] ?? 'image/jpeg';
    const base64Data = readFileSync(absolutePath).toString('base64');
    const fileName = `${gallery.title}${ext}`;
    const caption = options?.caption ?? gallery.title;

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        galleryId: gallery.id,
        customerId: options?.customerId,
        direction: 'OUTBOUND',
        type: 'GALLERY_IMAGE',
        toNumber: dto.phone,
        content: caption,
        mediaUrl: gallery.imageUrl,
        fileName,
        status: 'QUEUED',
        createdById: userId,
      },
    });

    await this.enqueue({
      messageId: message.id,
      toNumber: dto.phone,
      type: 'GALLERY_IMAGE',
      content: caption,
      mediaBase64: base64Data,
      mediaMimeType: mimeType,
      fileName,
    });

    return message;
  }

  async listMessages(query: QueryMessageDto): Promise<Paginated<unknown>> {
    const { page, limit, sortBy, sortOrder, customerId, status, direction } =
      query;
    const skip = toSkip(page, limit);

    const where: Prisma.WhatsAppMessageWhereInput = {
      deletedAt: null,
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(direction ? { direction } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.whatsAppMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: { select: { id: true, customerName: true, phone: true } },
        },
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
