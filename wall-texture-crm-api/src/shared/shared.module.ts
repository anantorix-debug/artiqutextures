import { Global, Module } from '@nestjs/common';
import { FileStorageService } from './services/file-storage.service';
import { PdfService } from './services/pdf.service';
import { ExcelService } from './services/excel.service';
import { MailerService } from './services/mailer.service';
import { AuditLogService } from './services/audit-log.service';

const services = [
  FileStorageService,
  PdfService,
  ExcelService,
  MailerService,
  AuditLogService,
];

@Global()
@Module({
  providers: services,
  exports: services,
})
export class SharedModule {}
