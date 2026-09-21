import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CompanyProfileService } from './company-profile.service';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, CompanyProfileService],
  exports: [SettingsService, CompanyProfileService],
})
export class SettingsModule {}
