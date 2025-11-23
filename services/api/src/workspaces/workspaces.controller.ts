import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  async getWorkspace(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace' })
  async updateWorkspace(@Param('id') id: string, @Body() data: { name?: string }) {
    return this.workspacesService.updateWorkspace(id, data);
  }

  @Patch(':id/settings')
  @ApiOperation({ summary: 'Update workspace settings' })
  async updateSettings(@Param('id') id: string, @Body() settings: any) {
    return this.workspacesService.updateSettings(id, settings);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite user to workspace' })
  async inviteUser(
    @Param('id') id: string,
    @Body() data: { email: string; role: string },
  ) {
    return this.workspacesService.inviteUser(id, data.email, data.role);
  }
}
