import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PublicController } from './public.controller';
import { GalleryModule } from '../gallery/gallery.module';
import { CustomerModule } from '../customer/customer.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TestimonialModule } from '../testimonial/testimonial.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 5 }]),
    GalleryModule,
    CustomerModule,
    NotificationsModule,
    WhatsappModule,
    TestimonialModule,
  ],
  controllers: [PublicController],
})
export class PublicModule {}
