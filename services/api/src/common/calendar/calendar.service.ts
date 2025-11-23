import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(userId: string, workspaceId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ userId, workspaceId }),
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, state: string) {
    const { userId, workspaceId } = JSON.parse(state);

    const { tokens } = await this.oauth2Client.getToken(code);

    this.oauth2Client.setCredentials(tokens);

    // Get user's email
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save or update tokens
    await this.prisma.calendarToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
      create: {
        userId,
        workspaceId,
        provider: 'google',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        email: userInfo.data.email!,
        scope: tokens.scope,
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        email: userInfo.data.email!,
        scope: tokens.scope,
      },
    });

    return {
      success: true,
      email: userInfo.data.email,
    };
  }

  async getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    const token = await this.prisma.calendarToken.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    });

    if (!token) {
      return null;
    }

    // Check if token is expired and refresh if needed
    if (token.expiresAt && token.expiresAt < new Date()) {
      await this.refreshAccessToken(userId);
      return this.getCalendarClient(userId); // Retry after refresh
    }

    this.oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  private async refreshAccessToken(userId: string) {
    const token = await this.prisma.calendarToken.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    });

    if (!token || !token.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: token.refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    await this.prisma.calendarToken.update({
      where: { id: token.id },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      },
    });
  }

  async createEvent(
    userId: string,
    event: {
      summary: string;
      description?: string;
      start: Date;
      end: Date;
      attendees?: string[];
      location?: string;
    },
  ): Promise<string | null> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      this.logger.warn(`No calendar connection for user ${userId}`);
      return null;
    }

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'UTC',
          },
          attendees: event.attendees?.map((email) => ({ email })),
          location: event.location,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 },
            ],
          },
        },
      });

      return response.data.id || null;
    } catch (error) {
      this.logger.error(`Failed to create calendar event: ${error.message}`);
      return null;
    }
  }

  async updateEvent(
    userId: string,
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      start?: Date;
      end?: Date;
    },
  ): Promise<boolean> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      return false;
    }

    try {
      const updateBody: any = {};

      if (updates.summary) updateBody.summary = updates.summary;
      if (updates.description) updateBody.description = updates.description;
      if (updates.start) {
        updateBody.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.end) {
        updateBody.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'UTC',
        };
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody: updateBody,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update calendar event: ${error.message}`);
      return false;
    }
  }

  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const calendar = await this.getCalendarClient(userId);

    if (!calendar) {
      return false;
    }

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete calendar event: ${error.message}`);
      return false;
    }
  }

  async disconnect(userId: string): Promise<void> {
    await this.prisma.calendarToken.deleteMany({
      where: {
        userId,
        provider: 'google',
      },
    });
  }

  async syncBookingToCalendar(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        lead: true,
        call: {
          include: {
            host: true,
          },
        },
      },
    });

    if (!booking || !booking.call?.host) {
      return;
    }

    const hostId = booking.call.host.id;
    const endTime = new Date(booking.scheduledAt.getTime() + booking.duration * 60 * 1000);

    const eventId = await this.createEvent(hostId, {
      summary: `Call with ${booking.lead.firstName} ${booking.lead.lastName}`,
      description: `Scheduled call\nLead: ${booking.lead.firstName} ${booking.lead.lastName}\nEmail: ${booking.lead.email}\nPhone: ${booking.lead.phone || 'N/A'}`,
      start: booking.scheduledAt,
      end: endTime,
      attendees: [booking.lead.email],
      location: booking.call.dailyRoomUrl || undefined,
    });

    if (eventId) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { googleEventId: eventId },
      });
    }
  }
}
