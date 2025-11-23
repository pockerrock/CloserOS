import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardMetrics(workspaceId: string, period: string) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [leads, deals, calls, revenue] = await Promise.all([
      this.prisma.lead.count({ where: { workspaceId, createdAt: { gte: startDate } } }),
      this.prisma.deal.count({ where: { lead: { workspaceId }, createdAt: { gte: startDate } } }),
      this.prisma.call.count({ where: { deal: { lead: { workspaceId } }, createdAt: { gte: startDate } } }),
      this.prisma.deal.aggregate({
        where: {
          lead: { workspaceId },
          stage: 'PAID',
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      period,
      leads: { total: leads },
      deals: { total: deals },
      calls: { total: calls },
      revenue: { total: revenue._sum.amount || 0 },
    };
  }

  async getFunnelMetrics(workspaceId: string) {
    const dealsByStage = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { lead: { workspaceId } },
      _count: true,
      _sum: { amount: true },
    });

    return dealsByStage.map((stage) => ({
      stage: stage.stage,
      count: stage._count,
      value: stage._sum.amount || 0,
    }));
  }

  async getTeamPerformance(workspaceId: string) {
    const closers = await this.prisma.user.findMany({
      where: { workspaceId, role: 'CLOSER' },
      include: {
        deals: {
          where: { stage: 'PAID' },
        },
      },
    });

    return closers.map((closer) => ({
      id: closer.id,
      name: `${closer.firstName} ${closer.lastName}`,
      dealsCount: closer.deals.length,
      revenue: closer.deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0),
    }));
  }
}
