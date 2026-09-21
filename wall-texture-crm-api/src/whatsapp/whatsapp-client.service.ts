import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
// whatsapp-web.js ships no first-class ESM/TS types for this import shape.

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
import { PrismaService } from '../prisma/prisma.service';
import { AppConfig } from '../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';

export interface SendResult {
  success: boolean;
  providerMessageId?: string;
  errorMessage?: string;
}

/**
 * Thin wrapper around a single whatsapp-web.js Client running in-process
 * alongside the rest of the API. Only one WhatsApp account is supported
 * (per spec), so this holds one client for the whole process and persists
 * connection state into `whatsapp_sessions` for the frontend to poll.
 */
@Injectable()
export class WhatsappClientService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappClientService.name);
  private client: any = null;
  private manualLogout = false;
  private readonly sessionName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.sessionName =
      this.configService.get<AppConfig>('app')!.whatsapp.sessionName;
  }

  async onModuleInit() {
    await this.ensureSessionRow();
    // Auto-start on boot so a previously authenticated session reconnects
    // without a manual /initialize call.
    void this.initialize();
  }

  private async ensureSessionRow() {
    const existing = await this.prisma.whatsAppSession.findFirst({
      where: { sessionName: this.sessionName },
    });
    if (!existing) {
      await this.prisma.whatsAppSession.create({
        data: { sessionName: this.sessionName, status: 'DISCONNECTED' },
      });
    }
  }

  async initialize(): Promise<void> {
    if (this.client) {
      this.logger.warn('WhatsApp client already initialized');
      return;
    }

    this.manualLogout = false;
    const { sessionDir, sessionName } =
      this.configService.get<AppConfig>('app')!.whatsapp;

    await this.updateSession({ status: 'INITIALIZING' });

    // Newer WhatsApp Web releases can break whatsapp-web.js message sending. Set
    // WHATSAPP_WEB_VERSION (e.g. 2.3000.1047288453) to pin a known-good cached version.
    const pinnedVersion = this.configService.get<string>('WHATSAPP_WEB_VERSION');

    this.client = new Client({
      ...(pinnedVersion
        ? { webVersion: pinnedVersion, webVersionCache: { type: 'local' } }
        : {}),
      authStrategy: new LocalAuth({
        clientId: sessionName,
        dataPath: sessionDir,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      },
    });

    this.client.on('qr', async (qr: string) => {
      const qrDataUrl = await QRCode.toDataURL(qr);
      await this.updateSession({
        status: 'QR_PENDING',
        qrCode: qrDataUrl,
        isConnected: false,
      });
      this.logger.log('QR code generated — scan it from Settings > WhatsApp');
    });

    this.client.on('authenticated', async () => {
      this.logger.log('WhatsApp authenticated');
    });

    this.client.on('ready', async () => {
      const info = this.client.info;
      await this.updateSession({
        status: 'CONNECTED',
        isConnected: true,
        qrCode: null,
        phoneNumber: info?.wid?.user ?? null,
        lastConnectedAt: new Date(),
      });
      this.logger.log('WhatsApp client is ready');
    });

    this.client.on('auth_failure', async (message: string) => {
      await this.updateSession({
        status: 'AUTH_FAILED',
        isConnected: false,
        qrCode: null,
      });
      this.logger.error(`WhatsApp authentication failed: ${message}`);
      await this.notificationsService.broadcast(
        'WHATSAPP_ALERT',
        'WhatsApp authentication failed',
        `WhatsApp could not authenticate: ${message}. Please re-scan the QR code from Settings.`,
        '/settings/whatsapp',
        1,
      );
    });

    this.client.on('disconnected', async (reason: string) => {
      await this.updateSession({
        status: 'DISCONNECTED',
        isConnected: false,
        lastDisconnectedAt: new Date(),
      });
      this.logger.warn(`WhatsApp disconnected: ${reason}`);
      this.client = null;

      if (!this.manualLogout) {
        await this.notificationsService.broadcast(
          'WHATSAPP_ALERT',
          'WhatsApp disconnected',
          `WhatsApp session disconnected (${reason}). Attempting to reconnect automatically.`,
          '/settings/whatsapp',
          1,
        );
        this.logger.log('Attempting to reconnect in 10s...');
        setTimeout(() => void this.initialize(), 10_000);
      }
    });

    try {
      await this.client.initialize();
    } catch (err) {
      this.logger.error(
        `Failed to initialize WhatsApp client: ${(err as Error).message}`,
      );
      await this.updateSession({ status: 'DISCONNECTED', isConnected: false });
      this.client = null;
    }
  }

  async logout(): Promise<void> {
    this.manualLogout = true;
    if (this.client) {
      await this.client.logout().catch(() => undefined);
      this.client = null;
    }
    await this.updateSession({
      status: 'DISCONNECTED',
      isConnected: false,
      qrCode: null,
      lastDisconnectedAt: new Date(),
    });
  }

  isReady(): boolean {
    return !!this.client?.info;
  }

  private toChatId(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `${withCountryCode}@c.us`;
  }

  /**
   * Resolves the recipient through WhatsApp itself (handles the new LID chat ids)
   * instead of guessing "<number>@c.us". Returns null if the number isn't on WhatsApp.
   */
  private async resolveChatId(phone: string): Promise<string | null> {
    const guessed = this.toChatId(phone);
    try {
      const found = await this.client.getNumberId(guessed.replace('@c.us', ''));
      return found?._serialized ?? null;
    } catch {
      return guessed;
    }
  }

  /**
   * whatsapp-web.js's own sendMessage builds message data in a shape current WhatsApp Web
   * rejects ("Data passed to getter must include an id property"). WhatsApp's own text
   * sender still works, so build the message with WhatsApp's own data builder and only
   * reuse the library for the media upload step.
   */
  private async sendViaWhatsappCore(
    chatId: string,
    text: string,
    media?: { data: string; mimetype: string; filename: string },
    caption?: string,
  ): Promise<string | undefined> {
    return this.client.pupPage.evaluate(
      async (
        chatId: string,
        text: string,
        media: { data: string; mimetype: string; filename: string } | null,
        caption: string | null,
      ) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        let step = 'chat';
        try {
        const chat = await w.WWebJS.getChat(chatId, { getAsModel: false });
        if (!chat) throw new Error('Chat not found');
        step = 'base';
        const textAction = w.require('WAWebSendTextMsgChatAction');
        // empty text yields no data, so use a placeholder body for media (replaced below)
        let message = await textAction.createTextMsgData(chat, text || 'x');
        step = 'media';
        let variants: unknown[] = [];
        if (media) {
          const mediaOptions = await w.WWebJS.processMediaData(media, {
            forceDocument: media.mimetype === 'application/pdf',
          });
          mediaOptions.caption = caption ?? undefined;
          const base = message;
          const json = mediaOptions.toJSON ? mediaOptions.toJSON() : {};
          const identity = {
            id: base.id,
            from: base.from,
            to: base.to,
            t: base.t,
            local: base.local,
            ack: base.ack,
            isNewMsg: base.isNewMsg,
          };
          // strip the model's internal bookkeeping fields (__x_*, parent, mirror, ...)
          const clean: Record<string, unknown> = {};
          for (const k of Object.keys(mediaOptions)) {
            if (k.startsWith('__') || k.startsWith('_') || ['parent', 'collection', 'mirror', 'revisionNumber'].includes(k)) continue;
            clean[k] = mediaOptions[k];
          }
          const cleanJson: Record<string, unknown> = {};
          for (const k of Object.keys(json)) {
            if (k !== 'id') cleanJson[k] = json[k];
          }
          variants = [
            { ...base, body: mediaOptions.preview, ...cleanJson, ...clean, ...identity },
            { ...base, body: mediaOptions.preview, ...cleanJson, ...identity },
            { ...base, body: mediaOptions.preview, ...mediaOptions, ...json, ...identity },
          ];
        }
        if (variants.length === 0) variants = [message];
        step = 'send';
        let lastErr: unknown;
        let result: any;
        for (let n = 0; n < variants.length; n++) {
          try {
            const [msgPromise, sentPromise] = w
              .require('WAWebSendMsgChatAction')
              .addAndSendMsgToChat(chat, variants[n]);
            result = await msgPromise;
            step = 'sent';
            await sentPromise;
            lastErr = undefined;
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr) throw lastErr;
        const mid = result?.msg?.id;
        return (mid?._serialized ?? (mid ? String(mid) : undefined)) as string | undefined;
        } catch (e: any) {
          throw new Error(`[${step}] ${e?.message} :: ${String(e?.stack).replace(/\s+/g, ' ').slice(0, 300)}`);
        }
      },
      chatId,
      text,
      media ?? null,
      caption ?? null,
    );
  }

  async sendText(phone: string, content: string): Promise<SendResult> {
    if (!this.client || !this.isReady()) {
      return { success: false, errorMessage: 'WhatsApp is not connected' };
    }
    try {
      const chatId = await this.resolveChatId(phone);
      if (!chatId) {
        return { success: false, errorMessage: 'This number is not registered on WhatsApp' };
      }
      try {
        const providerMessageId = await this.sendViaWhatsappCore(chatId, content);
        return { success: true, providerMessageId };
      } catch (coreErr) {
        this.logger.warn(`WhatsApp core send failed, trying library send: ${(coreErr as Error).message}`);
      }
      const message = await this.client.sendMessage(chatId, content, {
        sendSeen: false,
      });
      return { success: true, providerMessageId: message.id?._serialized };
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${(err as Error).stack ?? err}`);
      return { success: false, errorMessage: (err as Error).message };
    }
  }

  async sendMedia(
    phone: string,
    base64Data: string,
    mimeType: string,
    filename: string,
    caption?: string,
  ): Promise<SendResult> {
    if (!this.client || !this.isReady()) {
      return { success: false, errorMessage: 'WhatsApp is not connected' };
    }
    try {
      const chatId = await this.resolveChatId(phone);
      if (!chatId) {
        return { success: false, errorMessage: 'This number is not registered on WhatsApp' };
      }
      try {
        const providerMessageId = await this.sendViaWhatsappCore(
          chatId,
          '',
          { data: base64Data, mimetype: mimeType, filename },
          caption,
        );
        return { success: true, providerMessageId };
      } catch (coreErr) {
        this.logger.warn(`WhatsApp core media send failed, trying library send: ${(coreErr as Error).message}`);
      }
      const media = new MessageMedia(mimeType, base64Data, filename);
      const message = await this.client.sendMessage(chatId, media, {
        caption,
        sendSeen: false,
      });
      return { success: true, providerMessageId: message.id?._serialized };
    } catch (err) {
      this.logger.error(`WhatsApp send failed: ${(err as Error).stack ?? err}`);
      return { success: false, errorMessage: (err as Error).message };
    }
  }

  private async updateSession(data: Record<string, unknown>) {
    await this.prisma.whatsAppSession.updateMany({
      where: { sessionName: this.sessionName },
      data,
    });
  }
}
