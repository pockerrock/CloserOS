import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly mockMode: boolean;
  private readonly client: Twilio | null;
  private readonly fromNumber: string;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get('TWILIO_PHONE_NUMBER') || '+1234567890';

    this.mockMode = !accountSid || !authToken;

    if (this.mockMode) {
      this.logger.warn('SMS service running in MOCK MODE - messages will be logged, not sent');
      this.client = null;
    } else {
      this.client = new Twilio(accountSid, authToken);
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (this.mockMode) {
      this.logger.log(`[MOCK] SMS would be sent to: ${to}`);
      this.logger.log(`[MOCK] Message: ${message}`);
      return;
    }

    try {
      await this.client!.messages.create({
        body: message,
        from: this.fromNumber,
        to,
      });

      this.logger.log(`SMS sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendBookingReminder(
    to: string,
    data: {
      leadName: string;
      closerName: string;
      dateTime: string;
      hoursUntil: number;
    },
  ): Promise<void> {
    const message = `Hi ${data.leadName}! Reminder: You have a call with ${data.closerName} in ${data.hoursUntil} hours (${data.dateTime}). See you soon! - CloserOS`;
    await this.sendSms(to, message);
  }

  async sendBookingConfirmation(
    to: string,
    data: {
      leadName: string;
      closerName: string;
      dateTime: string;
      bookingLink?: string;
    },
  ): Promise<void> {
    let message = `Hi ${data.leadName}! Your call with ${data.closerName} is confirmed for ${data.dateTime}.`;

    if (data.bookingLink) {
      message += ` Manage: ${data.bookingLink}`;
    }

    message += ' - CloserOS';

    await this.sendSms(to, message);
  }

  async sendBookingCancellation(
    to: string,
    data: {
      leadName: string;
      dateTime: string;
    },
  ): Promise<void> {
    const message = `Hi ${data.leadName}! Your call scheduled for ${data.dateTime} has been cancelled. Contact us to reschedule. - CloserOS`;
    await this.sendSms(to, message);
  }

  async sendPaymentConfirmation(
    to: string,
    data: {
      leadName: string;
      amount: number;
      dealName: string;
    },
  ): Promise<void> {
    const formattedAmount = (data.amount / 100).toFixed(2);
    const message = `Hi ${data.leadName}! Payment of $${formattedAmount} received for ${data.dealName}. Thank you! - CloserOS`;
    await this.sendSms(to, message);
  }

  async sendFollowUpReminder(
    to: string,
    data: {
      closerName: string;
      leadName: string;
      taskDescription: string;
    },
  ): Promise<void> {
    const message = `Hi ${data.closerName}! Reminder: ${data.taskDescription} for ${data.leadName}. - CloserOS`;
    await this.sendSms(to, message);
  }
}
