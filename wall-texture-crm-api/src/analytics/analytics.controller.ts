import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('monthly-sales')
  @ApiOperation({
    summary: 'Monthly sales (revenue + quotation count) for the last N months',
  })
  monthlySales(@Query('months') months?: string) {
    return this.analyticsService.monthlySales(
      months ? parseInt(months, 10) : undefined,
    );
  }

  @Get('revenue-trends')
  @ApiOperation({ summary: 'Monthly and cumulative revenue trend' })
  revenueTrends(@Query('months') months?: string) {
    return this.analyticsService.revenueTrends(
      months ? parseInt(months, 10) : undefined,
    );
  }

  @Get('business-summary')
  @ApiOperation({
    summary:
      'Quotation/project value, expenses, profit & margin, payments due, project status',
  })
  businessSummary() {
    return this.analyticsService.businessSummary();
  }

  @Get('lead-conversion')
  @ApiOperation({ summary: 'Lead status funnel and overall conversion rate' })
  leadConversion() {
    return this.analyticsService.leadConversion();
  }

  @Get('quotation-performance')
  @ApiOperation({
    summary: 'Quotation approval rate, value by status, avg turnaround',
  })
  quotationPerformance() {
    return this.analyticsService.quotationPerformance();
  }

  @Get('most-requested-texture')
  @ApiOperation({ summary: 'Most frequently quoted products/textures' })
  mostRequestedTexture(@Query('limit') limit?: string) {
    return this.analyticsService.mostRequestedTexture(
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('project-progress')
  @ApiOperation({
    summary: 'Ongoing project progress and average completion by status',
  })
  projectProgress() {
    return this.analyticsService.projectProgress();
  }

  @Get('whatsapp-statistics')
  @ApiOperation({
    summary: 'WhatsApp message volume, delivery rate, breakdown by type/status',
  })
  whatsappStatistics() {
    return this.analyticsService.whatsappStatistics();
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export the full analytics report to Excel' })
  async exportExcel(@Res() res: Response) {
    const buffer = await this.analyticsService.exportExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=analytics-report.xlsx',
    });
    res.send(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export the full analytics report to PDF' })
  async exportPdf(@Res() res: Response) {
    const buffer = await this.analyticsService.exportPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=analytics-report.pdf',
    });
    res.send(buffer);
  }
}
