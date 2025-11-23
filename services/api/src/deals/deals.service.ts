import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DealStage } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

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
}
