import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DealStage } from '@prisma/client';

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
  @ApiOperation({ summary: 'Get all deals in workspace' })
  async getDeals(@CurrentUser('workspaceId') workspaceId: string) {
    return this.dealsService.findByWorkspace(workspaceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deal by ID' })
  async getDeal(@Param('id') id: string) {
    return this.dealsService.findById(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update deal stage' })
  async updateStage(@Param('id') id: string, @Body('stage') stage: DealStage) {
    return this.dealsService.updateStage(id, stage);
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
}
