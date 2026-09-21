import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { GalleryType, LeadSource, NotificationType } from '@prisma/client';
import { GalleryService } from '../gallery/gallery.service';
import { CustomerService } from '../customer/customer.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TestimonialService } from '../testimonial/testimonial.service';
import { Public } from '../common/decorators/public.decorator';
import { PublicGalleryQueryDto } from './dto/public-gallery-query.dto';
import { PublicContactDto } from './dto/public-contact.dto';
import { PublicGalleryRequestDto } from './dto/public-gallery-request.dto';

/**
 * Everything here backs the public marketing website (artiqusite). It only
 * ever reads ACTIVE gallery content and only ever creates leads through the
 * same CustomerService/GalleryService/WhatsappService the admin panel uses —
 * no duplicate data model, no duplicate business logic, no second WhatsApp
 * session. Write routes are throttled per-IP since they take unauthenticated
 * input from the open internet. A WhatsApp acknowledgement is queued through
 * whichever number the admin has connected via the QR-code pairing flow in
 * the admin panel (Settings → WhatsApp) — never a new/separate connection.
 */
@ApiTags('Public Website')
@Public()
@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    private readonly galleryService: GalleryService,
    private readonly customerService: CustomerService,
    private readonly notificationsService: NotificationsService,
    private readonly whatsappService: WhatsappService,
    private readonly testimonialService: TestimonialService,
  ) {}

  /** Queues a WhatsApp acknowledgement without letting a WhatsApp failure break the public form submission. */
  private async sendWhatsAppAck(
    customerId: string,
    phone: string,
    content: string,
  ) {
    try {
      await this.whatsappService.sendText({ customerId, phone, content });
    } catch (error) {
      this.logger.warn(
        `Failed to queue WhatsApp acknowledgement to ${phone}: ${(error as Error).message}`,
      );
    }
  }

  @Get('gallery')
  @ApiOperation({
    summary: 'Public: list active gallery images (portfolio + design)',
  })
  listGallery(@Query() query: PublicGalleryQueryDto) {
    return this.galleryService.findAll({ ...query, status: 'ACTIVE' });
  }

  @Get('gallery/categories')
  @ApiOperation({ summary: 'Public: list active gallery categories' })
  async listGalleryCategories() {
    const categories = await this.galleryService.findAllCategories();
    return categories.filter((c) => c.isActive);
  }

  @Get('gallery/:id')
  @ApiOperation({ summary: 'Public: get a single active gallery image' })
  async getGalleryImage(@Param('id', ParseUUIDPipe) id: string) {
    const image = await this.galleryService.findOne(id);
    if (image.status !== 'ACTIVE') {
      throw new BadRequestException('This item is not currently available');
    }
    return image;
  }

  @Get('testimonials')
  @ApiOperation({ summary: 'Public: list active testimonials' })
  async listTestimonials(@Query('limit') limit?: string) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const { items } = await this.testimonialService.findAll({
      page: 1,
      limit: parsedLimit,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      status: 'ACTIVE',
    });
    return items;
  }

  @Post('contact')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Public: submit the website contact form — creates a lead',
  })
  async submitContact(@Body() dto: PublicContactDto) {
    const customer = await this.customerService.create({
      customerName: dto.customerName,
      phone: dto.phone,
      email: dto.email,
      city: dto.city,
      requirement: dto.requirement,
      referredBy: dto.referredBy,
      leadSource: dto.referredBy ? LeadSource.REFERRAL : LeadSource.WEBSITE,
    });

    await this.notificationsService.broadcast(
      NotificationType.SYSTEM,
      'New website enquiry',
      `${dto.customerName} submitted the contact form on the website`,
      `/leads/${customer.id}`,
      0,
    );

    await this.sendWhatsAppAck(
      customer.id,
      dto.phone,
      `Hi ${dto.customerName}, thanks for reaching out to Aritiqu. We've received your enquiry and will get back to you shortly.`,
    );

    return { message: 'Thanks — we will get back to you shortly.' };
  }

  @Post('gallery/:id/request')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Public: request info about a specific gallery/project item — creates a lead',
  })
  async requestGalleryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublicGalleryRequestDto,
  ) {
    const image = await this.galleryService.findOne(id);
    if (image.type !== GalleryType.DESIGN) {
      throw new BadRequestException('Requests can only be made for Design catalog items');
    }

    const requirement = [
      `Enquiry about design: "${image.title}"${image.subtitle ? ` — ${image.subtitle}` : ''}`,
      dto.message,
    ]
      .filter(Boolean)
      .join('\n\n');

    const customer = await this.customerService.create({
      customerName: dto.customerName,
      phone: dto.phone,
      email: dto.email,
      city: dto.city,
      requirement,
      leadSource: LeadSource.WEBSITE,
    });

    await this.notificationsService.broadcast(
      NotificationType.SYSTEM,
      'New design request',
      `${dto.customerName} asked about "${image.title}" on the website`,
      `/leads/${customer.id}`,
      0,
    );

    // Sends the actual design photo over WhatsApp (not just a text ack) —
    // from whichever number the admin has connected via the QR-pairing
    // flow in Settings, and linked to the new lead so it shows in that
    // customer's WhatsApp history in the admin panel.
    try {
      await this.whatsappService.sendGalleryImage(
        image.id,
        { phone: dto.phone },
        undefined,
        {
          customerId: customer.id,
          caption: `Hi ${dto.customerName}, here's "${image.title}"${image.subtitle ? ` — ${image.subtitle}` : ''}. Our team at Aritiqu will reach out shortly with details.`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to queue WhatsApp gallery image to ${dto.phone}: ${(error as Error).message}`,
      );
      await this.sendWhatsAppAck(
        customer.id,
        dto.phone,
        `Hi ${dto.customerName}, thanks for asking about "${image.title}". Our team at Aritiqu will reach out shortly with details.`,
      );
    }

    return { message: 'Thanks — we will get back to you shortly.' };
  }
}
