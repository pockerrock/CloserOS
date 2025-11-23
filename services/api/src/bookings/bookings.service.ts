import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/notifications/email.service';
import { SmsService } from '../common/notifications/sms.service';
import { ActivityService } from '../common/activity/activity.service';
import { CalendarService } from '../common/calendar/calendar.service';
import { randomBytes } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private activityService: ActivityService,
    private calendarService: CalendarService,
  ) {}

  async create(data: {
    workspaceId: string;
    leadId: string;
    scheduledAt: Date;
    duration?: number;
    timezone?: string;
  }) {
    const bookingToken = randomBytes(16).toString('hex');

    const booking = await this.prisma.booking.create({
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

    // Log activity
    await this.activityService.logBookingCreated(
      data.workspaceId,
      undefined,
      booking.id,
      `${booking.lead.firstName} ${booking.lead.lastName}`,
      data.scheduledAt,
    );

    return booking;
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

    // Send confirmation notifications
    try {
      const closer = booking.workspace.users[0];
      const leadName = `${booking.lead.firstName} ${booking.lead.lastName}`;
      const closerName = closer ? `${closer.firstName} ${closer.lastName}` : 'your closer';
      const dateTime = booking.scheduledAt.toLocaleString();

      // Send email
      if (booking.lead.email && closer) {
        await this.emailService.sendBookingConfirmation(booking.lead.email, {
          leadName,
          closerName,
          dateTime,
          duration: booking.duration,
        });
      }

      // Send SMS
      if (booking.lead.phone) {
        await this.smsService.sendBookingConfirmation(booking.lead.phone, {
          leadName,
          closerName,
          dateTime,
        });
      }
    } catch (error) {
      console.error('Failed to send booking confirmation notifications:', error);
    }

    // Sync to Google Calendar (async, don't wait)
    this.calendarService.syncBookingToCalendar(booking.id).catch((error) => {
      console.error('Failed to sync booking to calendar:', error);
    });

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

    // Send cancellation notifications
    try {
      const closer = booking.workspace.users[0];
      const leadName = `${booking.lead.firstName} ${booking.lead.lastName}`;
      const closerName = closer ? `${closer.firstName} ${closer.lastName}` : 'your closer';
      const dateTime = booking.scheduledAt.toLocaleString();

      // Send email
      if (booking.lead.email && closer) {
        await this.emailService.sendBookingCancellation(booking.lead.email, {
          leadName,
          closerName,
          dateTime,
          reason,
        });
      }

      // Send SMS
      if (booking.lead.phone) {
        await this.smsService.sendBookingCancellation(booking.lead.phone, {
          leadName,
          dateTime,
        });
      }
    } catch (error) {
      console.error('Failed to send booking cancellation notifications:', error);
    }

    // Log activity
    await this.activityService.logBookingCancelled(
      booking.workspaceId,
      undefined,
      booking.id,
      `${booking.lead.firstName} ${booking.lead.lastName}`,
      reason,
    );

    return booking;
  }
}
