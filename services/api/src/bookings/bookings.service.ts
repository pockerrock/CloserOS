import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/notifications/email.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(data: {
    workspaceId: string;
    leadId: string;
    scheduledAt: Date;
    duration?: number;
    timezone?: string;
  }) {
    const bookingToken = randomBytes(16).toString('hex');

    return this.prisma.booking.create({
      data: {
        ...data,
        bookingToken,
        duration: data.duration || 60,
        timezone: data.timezone || 'UTC',
      },
      include: {
        lead: true,
      },
    });
  }

  async findByWorkspace(workspaceId: string) {
    return this.prisma.booking.findMany({
      where: { workspaceId },
      include: {
        lead: true,
        call: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        lead: true,
        call: true,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.booking.findUnique({
      where: { bookingToken: token },
      include: {
        lead: true,
      },
    });
  }

  async confirm(id: string) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { confirmed: true },
      include: {
        lead: true,
        workspace: {
          include: {
            users: {
              where: { role: 'CLOSER' },
              take: 1,
            },
          },
        },
      },
    });

    // Send confirmation email
    try {
      const closer = booking.workspace.users[0];
      if (booking.lead.email && closer) {
        await this.emailService.sendBookingConfirmation(booking.lead.email, {
          leadName: `${booking.lead.firstName} ${booking.lead.lastName}`,
          closerName: `${closer.firstName} ${closer.lastName}`,
          dateTime: booking.scheduledAt.toLocaleString(),
          duration: booking.duration,
        });
      }
    } catch (error) {
      console.error('Failed to send booking confirmation email:', error);
    }

    return booking;
  }

  async cancel(id: string, reason?: string) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: {
        cancelled: true,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: {
        lead: true,
        workspace: {
          include: {
            users: {
              where: { role: 'CLOSER' },
              take: 1,
            },
          },
        },
      },
    });

    // Send cancellation email
    try {
      const closer = booking.workspace.users[0];
      if (booking.lead.email && closer) {
        await this.emailService.sendBookingCancellation(booking.lead.email, {
          leadName: `${booking.lead.firstName} ${booking.lead.lastName}`,
          closerName: `${closer.firstName} ${closer.lastName}`,
          dateTime: booking.scheduledAt.toLocaleString(),
          reason,
        });
      }
    } catch (error) {
      console.error('Failed to send booking cancellation email:', error);
    }

    return booking;
  }
}
