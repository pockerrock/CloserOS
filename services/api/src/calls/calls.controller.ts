import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new call' })
  async createCall(
    @CurrentUser() user: any,
    @Body() data: { bookingId?: string; dealId?: string },
  ) {
    return this.callsService.createCall({
      workspaceId: user.workspaceId,
      hostId: user.id,
      ...data,
    });
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a call' })
  async startCall(@Param('id') id: string) {
    return this.callsService.startCall(id);
  }

  @Post(':id/end')
  @ApiOperation({ summary: 'End a call' })
  async endCall(@Param('id') id: string) {
    return this.callsService.endCall(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all calls in workspace' })
  async getCalls(@CurrentUser('workspaceId') workspaceId: string) {
    return this.callsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call by ID' })
  async getCall(@Param('id') id: string) {
    return this.callsService.findById(id);
  }
}
