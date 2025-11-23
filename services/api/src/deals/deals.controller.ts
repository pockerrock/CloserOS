import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DealStage } from '../common/prisma/prisma.types';

@ApiTags('deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  async createDeal(@CurrentUser() user: any, @Body() data: any) {
    return this.dealsService.create({
      workspaceId: user.workspaceId,
      ...data,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals in workspace with optional search and filters' })
  async getDeals(
    @CurrentUser('workspaceId') workspaceId: string,
    @Query('search') search?: string,
    @Query('stage') stage?: string,
    @Query('closerId') closerId?: string,
  ) {
    if (search || stage || closerId) {
      return this.dealsService.search(workspaceId, { search, stage, closerId });
    }
    return this.dealsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  async getDeal(@Param('id') id: string) {
    return this.dealsService.findById(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update deal stage' })
  async updateStage(
    @Param('id') id: string,
    @Body('stage') stage: DealStage,
    @CurrentUser('id') userId: string,
  ) {
    return this.dealsService.updateStage(id, stage, userId);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark deal as paid' })
  async markPaid(@Param('id') id: string, @Body('stripePaymentId') paymentId: string) {
    return this.dealsService.markPaid(id, paymentId);
  }

  @Post(':id/checkout')
  @ApiOperation({ summary: 'Create Stripe checkout session for deal' })
  async createCheckout(@Param('id') id: string) {
    return this.dealsService.createCheckoutSession(id);
  }

  @Post('bulk/update-stage')
  @ApiOperation({ summary: 'Bulk update deal stages' })
  async bulkUpdateStage(
    @Body() data: { dealIds: string[]; stage: DealStage },
  ) {
    return this.dealsService.bulkUpdateStage(data.dealIds, data.stage);
  }

  @Post('bulk/assign')
  @ApiOperation({ summary: 'Bulk assign deals to a closer' })
  async bulkAssignDeals(
    @Body() data: { dealIds: string[]; closerId: string },
  ) {
    return this.dealsService.bulkAssign(data.dealIds, data.closerId);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete deals' })
  async bulkDeleteDeals(@Body() data: { dealIds: string[] }) {
    return this.dealsService.bulkDelete(data.dealIds);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export deals to CSV' })
  async exportDeals(
    @CurrentUser('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const csv = await this.dealsService.exportToCSV(workspaceId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=deals-${Date.now()}.csv`);
    res.send(csv);
  }
}
