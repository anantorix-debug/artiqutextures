import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@Body() dto: CreateCustomerDto, @CurrentUser('id') userId: string) {
    return this.customerService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with search, filter & pagination' })
  findAll(@Query() query: QueryCustomerDto) {
    return this.customerService.findAll(query);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export filtered leads to Excel' })
  async exportExcel(@Query() query: QueryCustomerDto, @Res() res: Response) {
    const buffer = await this.customerService.exportExcel(query);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=leads-export.xlsx',
    });
    res.send(buffer);
  }

  @Get('export/pdf')
  @ApiOperation({ summary: 'Export filtered leads to PDF' })
  async exportPdf(@Query() query: QueryCustomerDto, @Res() res: Response) {
    const buffer = await this.customerService.exportPdf(query);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=leads-export.pdf',
    });
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single lead' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOne(id);
  }

  @Get(':id/profile')
  @ApiOperation({
    summary:
      'Full customer profile — timeline, quotations, projects, WhatsApp history',
  })
  getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getProfile(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customerService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a lead' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.customerService.remove(id, userId);
  }

  // ---------------------------------------------------------------------
  // Activity Timeline
  // ---------------------------------------------------------------------

  @Get(':id/activities')
  @ApiOperation({ summary: 'List timeline/activity log for a lead' })
  listActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.listActivities(id);
  }

  @Post(':id/activities')
  @ApiOperation({
    summary: 'Add a note/call/meeting/follow-up entry to the timeline',
  })
  addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.customerService.addActivity(id, dto, userId);
  }
}
