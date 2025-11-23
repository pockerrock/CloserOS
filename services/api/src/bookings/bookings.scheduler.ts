import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../common/notifications/email.service';
import { SmsService } from '../common/notifications/sms.service';

@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  // Run every hour to check for bookings that need reminders
  @Cron(CronExpression.EVERY_HOUR)
  async sendUpcomingBookingReminders() {
    this.logger.log('Running booking reminder check...');

    try {
      // Find bookings that are:
      // 1. Confirmed (confirmed = true)
      // 2. Not cancelled (cancelled = false)
      // 3. Starting in the next 24 hours
      // 4. Haven't been reminded in the last hour (check remindersSent JSON)
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingBookings = await this.prisma.booking.findMany({
        where: {
          confirmed: true,
          cancelled: false,
          scheduledAt: {
            gte: now,
            lte: tomorrow,
          },
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
          call: {
            include: {
              host: true,
            },
          },
        },
      });

      this.logger.log(`Found ${upcomingBookings.length} upcoming bookings`);

      for (const booking of upcomingBookings) {
        try {
          // Check if reminder was already sent in the last hour
          const remindersSent = (booking.remindersSent as any[]) || [];
          const lastReminder = remindersSent.length > 0 ? new Date(remindersSent[remindersSent.length - 1]) : null;
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

          if (lastReminder && lastReminder > oneHourAgo) {
            this.logger.debug(`Skipping booking ${booking.id} - reminder sent recently`);
            continue;
          }

          await this.sendBookingReminder(booking);

          // Update remindersSent
          await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
              remindersSent: [...remindersSent, new Date().toISOString()],
            },
          });

          this.logger.log(`Sent reminder for booking ${booking.id}`);
        } catch (error) {
          this.logger.error(`Failed to send reminder for booking ${booking.id}:`, error);
        }
      }

      this.logger.log('Booking reminder check completed');
    } catch (error) {
      this.logger.error('Error in booking reminder scheduler:', error);
    }
  }

  private async sendBookingReminder(booking: any) {
    const timeUntilBooking = new Date(booking.scheduledAt).getTime() - Date.now();
    const hoursUntil = Math.floor(timeUntilBooking / (1000 * 60 * 60));

    const closer = booking.call?.host || booking.workspace?.users?.[0];
    const closerName = closer ? `${closer.firstName} ${closer.lastName}` : 'your closer';
    const leadName = `${booking.lead.firstName} ${booking.lead.lastName}`;
    const scheduledTime = new Date(booking.scheduledAt).toLocaleString();

    // Get meeting URL from call if it exists
    const meetingUrl = booking.call?.dailyRoomUrl;

    // Send email to lead
    if (booking.lead?.email) {
      await this.emailService.sendEmail({
        to: booking.lead.email,
        subject: `Reminder: Upcoming Call in ${hoursUntil} hours`,
        html: `
          <h2>Call Reminder</h2>
          <p>Hi ${leadName},</p>
          <p>This is a reminder that you have a call scheduled with ${closerName}:</p>
          <ul>
            <li><strong>When:</strong> ${scheduledTime}</li>
            <li><strong>Duration:</strong> ${booking.duration} minutes</li>
            ${meetingUrl ? `<li><strong>Join URL:</strong> <a href="${meetingUrl}">${meetingUrl}</a></li>` : ''}
          </ul>
          <p>We look forward to speaking with you!</p>
        `,
      });
    }

    // Send SMS to lead if phone number exists
    if (booking.lead?.phone) {
      const message = `Reminder: You have a call with ${closerName} in ${hoursUntil} hours at ${new Date(booking.scheduledAt).toLocaleTimeString()}.${meetingUrl ? ` Join: ${meetingUrl}` : ''}`;

      await this.smsService.sendSms(booking.lead.phone, message);
    }
  }

  // Run at 9 AM every day to send daily digest of bookings
  @Cron('0 9 * * *')
  async sendDailyBookingDigest() {
    this.logger.log('Sending daily booking digest...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get all workspaces
      const workspaces = await this.prisma.workspace.findMany({
        include: {
          users: {
            where: {
              role: { in: ['OWNER', 'ADMIN', 'CLOSER'] },
            },
          },
        },
      });

      for (const workspace of workspaces) {
        // Get today's bookings for this workspace
        const todaysBookings = await this.prisma.booking.findMany({
          where: {
            workspaceId: workspace.id,
            confirmed: true,
            cancelled: false,
            scheduledAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          include: {
            lead: true,
            call: {
              include: {
                host: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        });

        if (todaysBookings.length > 0) {
          // Send digest to workspace admins/owners
          for (const user of workspace.users) {
            if (user.email) {
              await this.emailService.sendEmail({
                to: user.email,
                subject: `Daily Booking Digest - ${todaysBookings.length} calls today`,
                html: `
                  <h2>Daily Booking Digest</h2>
                  <p>Hi ${user.firstName},</p>
                  <p>You have ${todaysBookings.length} call${todaysBookings.length > 1 ? 's' : ''} scheduled for today in ${workspace.name}:</p>
                  <ul>
                    ${todaysBookings.map(b => {
                      const closer = b.call?.host;
                      const closerName = closer ? `${closer.firstName} ${closer.lastName}` : 'Unassigned';
                      return `
                        <li>
                          <strong>${new Date(b.scheduledAt).toLocaleTimeString()}</strong> -
                          ${b.lead.firstName} ${b.lead.lastName}
                          (${b.duration} min with ${closerName})
                        </li>
                      `;
                    }).join('')}
                  </ul>
                  <p>Have a productive day!</p>
                `,
              });
            }
          }

          this.logger.log(`Sent daily digest for workspace ${workspace.id}: ${todaysBookings.length} bookings`);
        }
      }

      this.logger.log('Daily booking digest completed');
    } catch (error) {
      this.logger.error('Error sending daily booking digest:', error);
    }
  }
}
