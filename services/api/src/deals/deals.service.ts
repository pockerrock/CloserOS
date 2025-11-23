import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from '../common/stripe/stripe.service';
import { DealStage } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
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

  async updateStage(id: string, stage: DealStage) {
    return this.prisma.deal.update({
      where: { id },
      data: { stage },
    });
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
}
