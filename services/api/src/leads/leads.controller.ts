import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async createLead(@CurrentUser() user: any, @Body() data: any) {
    return this.leadsService.create({
      workspaceId: user.workspaceId,
      createdById: user.id,
      ...data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads in workspace with optional search and filters' })
  async getLeads(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
  ) {
    if (search || status || source) {
      return this.leadsService.search(workspaceId, { search, status, source });
    }
    return this.leadsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async getLead(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  async updateLead(@Param('id') id: string, @Body() data: any) {
    return this.leadsService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  async deleteLead(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }

  @Post('bulk/assign')
  @ApiOperation({ summary: 'Bulk assign leads to a user' })
  async bulkAssignLeads(
    @Body() data: { leadIds: string[]; assignedToId: string },
  ) {
    return this.leadsService.bulkAssign(data.leadIds, data.assignedToId);
  }

  @Post('bulk/update')
  @ApiOperation({ summary: 'Bulk update leads' })
  async bulkUpdateLeads(
    @Body() data: { leadIds: string[]; updates: any },
  ) {
    return this.leadsService.bulkUpdate(data.leadIds, data.updates);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete leads' })
  async bulkDeleteLeads(@Body() data: { leadIds: string[] }) {
    return this.leadsService.bulkDelete(data.leadIds);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export leads to CSV' })
  async exportLeads(
    @CurrentUser('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const csv = await this.leadsService.exportToCSV(workspaceId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${Date.now()}.csv`);
    res.send(csv);
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import leads from CSV file' })
  @UseInterceptors(FileInterceptor('file'))
  async importLeads(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.leadsService.importFromCSV(file.buffer.toString('utf-8'), user.workspaceId, user.id);
  }
}
