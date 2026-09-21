import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { SendTextDto } from './dto/send-text.dto';
import { SendMediaDto } from './dto/send-media.dto';
import { SendQuotationDto } from './dto/send-quotation.dto';
import { SendGalleryDto } from './dto/send-gallery.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { buildMemoryMulterOptions } from '../shared/utils/multer.config';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  @ApiOperation({
    summary: 'WhatsApp connection/session status (QR code, connected number)',
  })
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Start pairing — generates a QR code to scan' })
  initialize() {
    return this.whatsappService.initialize();
  }

  @Post('logout')
  @ApiOperation({ summary: 'Disconnect the WhatsApp session' })
  logout() {
    return this.whatsappService.logout();
  }

  @Get('messages')
  @ApiOperation({
    summary: 'List queued/sent/delivered/failed WhatsApp messages',
  })
  listMessages(@Query() query: QueryMessageDto) {
    return this.whatsappService.listMessages(query);
  }

  @Post('send/text')
  @ApiOperation({
    summary: 'Queue a text message (never blocks — processed asynchronously)',
  })
  sendText(@Body() dto: SendTextDto, @CurrentUser('id') userId: string) {
    return this.whatsappService.sendText(dto, userId);
  }

  @Post('send/image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Queue an image message (sent from memory, never written to disk)',
  })
  @UseInterceptors(FileInterceptor('file', buildMemoryMulterOptions('image')))
  sendImage(
    @Body() dto: SendMediaDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendMedia(dto, file, 'IMAGE', userId);
  }

  @Post('send/document')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Queue a document message (sent from memory, never written to disk)',
  })
  @UseInterceptors(
    FileInterceptor('file', buildMemoryMulterOptions('document')),
  )
  sendDocument(
    @Body() dto: SendMediaDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendMedia(dto, file, 'DOCUMENT', userId);
  }

  @Post('send/quotation/:quotationId')
  @ApiOperation({
    summary: 'Generate the quotation PDF and queue it for WhatsApp delivery',
  })
  sendQuotation(
    @Param('quotationId', ParseUUIDPipe) quotationId: string,
    @Body() dto: SendQuotationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendQuotationPdf(quotationId, dto, userId);
  }

  @Post('send/gallery/:galleryId')
  @ApiOperation({ summary: 'Queue a gallery image for WhatsApp delivery' })
  sendGallery(
    @Param('galleryId', ParseUUIDPipe) galleryId: string,
    @Body() dto: SendGalleryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.whatsappService.sendGalleryImage(galleryId, dto, userId);
  }
}
