import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all leads in workspace' })
  async getLeads(@CurrentUser('workspaceId') workspaceId: string) {
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
}
