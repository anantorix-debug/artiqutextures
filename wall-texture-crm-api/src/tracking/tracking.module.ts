import { Module } from '@nestjs/common';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { ProjectManagementController } from './project-management.controller';
import { ProjectManagementService } from './project-management.service';
import { QuotationModule } from '../quotation/quotation.module';

@Module({
  imports: [QuotationModule],
  controllers: [TrackingController, ProjectManagementController],
  providers: [TrackingService, ProjectManagementService],
  exports: [TrackingService, ProjectManagementService],
})
export class TrackingModule {}
