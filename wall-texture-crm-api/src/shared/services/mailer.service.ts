import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AppConfig } from '../../config/configuration';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SmtpOverride {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  fromName?: string;
  fromEmail?: string;
}

/**
 * SMTP is configurable at runtime via the Settings module (see SettingsService),
 * so the transporter is built per-send rather than cached at boot — an override
 * always wins over the .env fallback.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(
    options: SendMailOptions,
    override?: SmtpOverride,
  ): Promise<boolean> {
    const smtp = override ?? this.configService.get<AppConfig>('app')!.smtp;

    if (!smtp.user || !smtp.password) {
      this.logger.warn(
        'SMTP credentials are not configured — skipping email send',
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.password },
    });

    try {
      await transporter.sendMail({
        from: `"${smtp.fromName ?? 'Wall Texture CRM'}" <${smtp.fromEmail ?? smtp.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (err) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${(err as Error).message}`,
      );
      return false;
    }
  }
}
