import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { ActivityService } from '../common/activity/activity.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly activityService: ActivityService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics' })
  async getDashboardAnalytics(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('period') period?: string,
  ) {
    return this.analyticsService.getDashboardMetrics(workspaceId, period || '30d');
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Get sales funnel metrics' })
  async getFunnelMetrics(@CurrentUser('workspaceId') workspaceId: string) {
    return this.analyticsService.getFunnelMetrics(workspaceId);
  }

  @Get('team-performance')
  @ApiOperation({ summary: 'Get team performance metrics' })
  async getTeamPerformance(@CurrentUser('workspaceId') workspaceId: string) {
    return this.analyticsService.getTeamPerformance(workspaceId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivity(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.findByWorkspace(workspaceId, limit ? parseInt(limit) : 50);
  }
}
