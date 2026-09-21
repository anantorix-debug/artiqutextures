import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('cards')
  @ApiOperation({
    summary:
      'Dashboard KPI cards (leads, quotations, projects, revenue, WhatsApp, gallery)',
  })
  getCards() {
    return this.dashboardService.getCards();
  }

  @Get('charts')
  @ApiOperation({
    summary: 'Dashboard chart datasets (revenue, conversion, statuses, growth)',
  })
  getCharts() {
    return this.dashboardService.getCharts();
  }

  @Get('recent-activities')
  @ApiOperation({
    summary: 'Recent activity feed across all leads (paginated)',
  })
  getRecentActivities(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentActivities(
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
