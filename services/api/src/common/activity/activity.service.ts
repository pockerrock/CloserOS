import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ActivityData {
  workspaceId: string;
  userId?: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  leadId?: string;
  dealId?: string;
  callId?: string;
  bookingId?: string;
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(data: ActivityData) {
    return this.prisma.activity.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async findByWorkspace(workspaceId: string, limit: number = 50) {
    return this.prisma.activity.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByLead(leadId: string, limit: number = 20) {
    return this.prisma.activity.findMany({
      where: { leadId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByDeal(dealId: string, limit: number = 20) {
    return this.prisma.activity.findMany({
      where: { dealId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Helper methods for common activities
  async logLeadCreated(workspaceId: string, userId: string, leadId: string, leadName: string) {
    return this.create({
      workspaceId,
      userId,
      type: 'lead.created',
      title: `Created lead: ${leadName}`,
      leadId,
    });
  }

  async logLeadUpdated(workspaceId: string, userId: string, leadId: string, leadName: string, changes: string[]) {
    return this.create({
      workspaceId,
      userId,
      type: 'lead.updated',
      title: `Updated lead: ${leadName}`,
      description: `Updated: ${changes.join(', ')}`,
      leadId,
      metadata: { changes },
    });
  }

  async logLeadAssigned(workspaceId: string, userId: string, leadId: string, leadName: string, assignedToName: string) {
    return this.create({
      workspaceId,
      userId,
      type: 'lead.assigned',
      title: `Assigned lead: ${leadName}`,
      description: `Assigned to ${assignedToName}`,
      leadId,
      metadata: { assignedToName },
    });
  }

  async logDealStageChanged(
    workspaceId: string,
    userId: string,
    dealId: string,
    leadName: string,
    oldStage: string,
    newStage: string,
  ) {
    return this.create({
      workspaceId,
      userId,
      type: 'deal.stage_changed',
      title: `Deal stage changed: ${leadName}`,
      description: `${oldStage} → ${newStage}`,
      dealId,
      metadata: { oldStage, newStage },
    });
  }

  async logCallCompleted(
    workspaceId: string,
    userId: string,
    callId: string,
    leadName: string,
    duration: number,
  ) {
    return this.create({
      workspaceId,
      userId,
      type: 'call.completed',
      title: `Call completed: ${leadName}`,
      description: `Duration: ${Math.floor(duration / 60)} minutes`,
      callId,
      metadata: { duration },
    });
  }

  async logBookingCreated(
    workspaceId: string,
    userId: string | undefined,
    bookingId: string,
    leadName: string,
    scheduledAt: Date,
  ) {
    return this.create({
      workspaceId,
      userId,
      type: 'booking.created',
      title: `Booking scheduled: ${leadName}`,
      description: `Scheduled for ${scheduledAt.toLocaleString()}`,
      bookingId,
      metadata: { scheduledAt: scheduledAt.toISOString() },
    });
  }

  async logBookingCancelled(
    workspaceId: string,
    userId: string | undefined,
    bookingId: string,
    leadName: string,
    reason?: string,
  ) {
    return this.create({
      workspaceId,
      userId,
      type: 'booking.cancelled',
      title: `Booking cancelled: ${leadName}`,
      description: reason || undefined,
      bookingId,
      metadata: { reason },
    });
  }
}
