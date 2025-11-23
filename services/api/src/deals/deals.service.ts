import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from '../common/stripe/stripe.service';
import { ActivityService } from '../common/activity/activity.service';
import { DealStage } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
    private activityService: ActivityService,
  ) {}

  async create(data: {
    workspaceId: string;
    leadId: string;
    closerId?: string;
    amount?: number;
    stage?: DealStage;
  }) {
    return this.prisma.deal.create({
      data,
      include: {
        lead: true,
        closer: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.deal.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        closer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.deal.findUnique({
      where: { id },
      include: {
        lead: true,
        closer: true,
        calls: true,
      },
    });
  }

  async updateStage(id: string, stage: DealStage, userId?: string) {
    // Get deal before update to log activity
    const dealBefore = await this.prisma.deal.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!dealBefore) {
      throw new Error('Deal not found');
    }

    const deal = await this.prisma.deal.update({
      where: { id },
      data: { stage },
      include: { lead: true, closer: true },
    });

    // Log activity
    if (userId) {
      await this.activityService.logDealStageChanged(
        deal.workspaceId,
        userId,
        deal.id,
        `${deal.lead.firstName} ${deal.lead.lastName}`,
        dealBefore.stage,
        stage,
      );
    }

    return deal;
  }

  async markPaid(id: string, stripePaymentId: string) {
    return this.prisma.deal.update({
      where: { id },
      data: {
        stage: DealStage.PAID,
        stripePaymentId,
        paidAt: new Date(),
      },
    });
  }

  async createCheckoutSession(dealId: string) {
    const deal = await this.findById(dealId);

    if (!deal) {
      throw new Error('Deal not found');
    }

    if (!deal.amount) {
      throw new Error('Deal amount not set');
    }

    const webAppUrl = this.configService.get<string>('NEXT_PUBLIC_WEB_URL', 'http://localhost:3000');

    const session = await this.stripeService.createCheckoutSession({
      dealId: deal.id,
      amount: Number(deal.amount),
      currency: deal.currency,
      customerEmail: deal.lead.email,
      successUrl: `${webAppUrl}/deals/${deal.id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${webAppUrl}/deals/${deal.id}/cancel`,
      metadata: {
        dealId: deal.id,
        leadId: deal.leadId,
        workspaceId: deal.workspaceId,
      },
    });

    // Update deal with session ID
    await this.prisma.deal.update({
      where: { id: dealId },
      data: { stage: DealStage.CLOSED },
    });

    return {
      sessionId: session.id,
      sessionUrl: session.url,
    };
  }

  async search(
    workspaceId: string,
    filters: {
      search?: string;
      stage?: string;
      closerId?: string;
    },
  ) {
    const { search, stage, closerId } = filters;

    const where: any = { workspaceId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { lead: { firstName: { contains: search, mode: 'insensitive' } } },
        { lead: { lastName: { contains: search, mode: 'insensitive' } } },
        { lead: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    if (closerId) {
      where.closerId = closerId;
    }

    return this.prisma.deal.findMany({
      where,
      include: {
        lead: true,
        closer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkUpdateStage(dealIds: string[], stage: DealStage) {
    const result = await this.prisma.deal.updateMany({
      where: { id: { in: dealIds } },
      data: { stage },
    });

    return {
      message: `${result.count} deals updated to stage ${stage}`,
      count: result.count,
    };
  }

  async bulkAssign(dealIds: string[], closerId: string) {
    const result = await this.prisma.deal.updateMany({
      where: { id: { in: dealIds } },
      data: { closerId },
    });

    return {
      message: `${result.count} deals assigned successfully`,
      count: result.count,
    };
  }

  async bulkDelete(dealIds: string[]) {
    const result = await this.prisma.deal.deleteMany({
      where: { id: { in: dealIds } },
    });

    return {
      message: `${result.count} deals deleted successfully`,
      count: result.count,
    };
  }

  async exportToCSV(workspaceId: string): Promise<string> {
    const deals = await this.prisma.deal.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        closer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV header
    const header = 'ID,Deal Name,Lead Name,Lead Email,Closer,Stage,Amount,Currency,Payment ID,Created At,Paid At\n';

    // CSV rows
    const rows = deals.map((deal) => {
      const leadName = deal.lead ? `${deal.lead.firstName} ${deal.lead.lastName}` : '';
      const leadEmail = deal.lead?.email || '';
      const closerName = deal.closer ? `${deal.closer.firstName} ${deal.closer.lastName}` : '';
      const amount = deal.amount ? Number(deal.amount).toFixed(2) : '0.00';
      const paidAt = deal.paidAt ? deal.paidAt.toISOString() : '';

      return [
        deal.id,
        deal.name || '',
        leadName,
        leadEmail,
        closerName,
        deal.stage,
        amount,
        deal.currency || 'USD',
        deal.stripePaymentId || '',
        deal.createdAt.toISOString(),
        paidAt,
      ].join(',');
    }).join('\n');

    return header + rows;
  }
}
