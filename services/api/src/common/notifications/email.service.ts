import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mockMode: boolean;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.mockMode = !this.config.get('RESEND_API_KEY');
    this.fromEmail = this.config.get('EMAIL_FROM') || 'noreply@closeros.com';

    if (this.mockMode) {
      this.logger.warn('Email service running in MOCK MODE - emails will be logged, not sent');
    }
  }

  async sendEmail(data: EmailData): Promise<void> {
    const { to, subject, html, from } = data;

    if (this.mockMode) {
      this.logger.log(`[MOCK] Email would be sent to: ${to}`);
      this.logger.log(`[MOCK] Subject: ${subject}`);
      this.logger.log(`[MOCK] HTML: ${html.substring(0, 100)}...`);
      return;
    }

    try {
      // In production, you would use Resend SDK here
      // const resend = new Resend(this.config.get('RESEND_API_KEY'));
      // await resend.emails.send({
      //   from: from || this.fromEmail,
      //   to,
      //   subject,
      //   html,
      // });

      this.logger.log(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }

  async sendBookingConfirmation(
    to: string,
    data: {
      leadName: string;
      closerName: string;
      dateTime: string;
      duration: number;
      meetingLink?: string;
    },
  ): Promise<void> {
    const subject = 'Booking Confirmation - CloserOS';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { font-weight: bold; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.leadName},</p>
              <p>Your call with ${data.closerName} has been confirmed.</p>

              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Date & Time:</span>
                  <span>${data.dateTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span>${data.duration} minutes</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Closer:</span>
                  <span>${data.closerName}</span>
                </div>
              </div>

              ${
                data.meetingLink
                  ? `<p style="text-align: center;">
                       <a href="${data.meetingLink}" class="button">Join Call</a>
                     </p>`
                  : ''
              }

              <p>We look forward to speaking with you!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CloserOS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendBookingCancellation(
    to: string,
    data: {
      leadName: string;
      closerName: string;
      dateTime: string;
      reason?: string;
    },
  ): Promise<void> {
    const subject = 'Booking Cancelled - CloserOS';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${data.leadName},</p>
              <p>Your call with ${data.closerName} scheduled for ${data.dateTime} has been cancelled.</p>
              ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              <p>If you'd like to reschedule, please contact us.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CloserOS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendPaymentReceipt(
    to: string,
    data: {
      leadName: string;
      amount: number;
      dealName: string;
      transactionId: string;
    },
  ): Promise<void> {
    const subject = 'Payment Receipt - CloserOS';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .receipt { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .amount { font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            <div class="content">
              <p>Hi ${data.leadName},</p>
              <p>Thank you for your payment!</p>

              <div class="receipt">
                <div class="amount">$${(data.amount / 100).toFixed(2)}</div>
                <div class="detail-row">
                  <span>Transaction ID:</span>
                  <span>${data.transactionId}</span>
                </div>
                <div class="detail-row">
                  <span>Deal:</span>
                  <span>${data.dealName}</span>
                </div>
                <div class="detail-row">
                  <span>Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <p>You will receive your purchase details shortly.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CloserOS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendTeamInvite(
    to: string,
    data: {
      inviterName: string;
      workspaceName: string;
      role: string;
      inviteLink: string;
    },
  ): Promise<void> {
    const subject = `You've been invited to join ${data.workspaceName} on CloserOS`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Team Invitation</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>${data.inviterName} has invited you to join <strong>${data.workspaceName}</strong> on CloserOS as a <strong>${data.role}</strong>.</p>

              <p style="text-align: center;">
                <a href="${data.inviteLink}" class="button">Accept Invitation</a>
              </p>

              <p>If you don't want to accept this invitation, you can ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CloserOS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendCallSummary(
    to: string,
    data: {
      closerName: string;
      leadName: string;
      duration: number;
      summary: string;
      nextSteps?: string[];
    },
  ): Promise<void> {
    const subject = `Call Summary: ${data.leadName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #7c3aed; }
            .next-steps { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            ul { padding-left: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Call Summary</h1>
            </div>
            <div class="content">
              <p>Hi ${data.closerName},</p>
              <p>Here's a summary of your call with <strong>${data.leadName}</strong> (${data.duration} minutes):</p>

              <div class="summary">
                <h3>AI-Generated Summary</h3>
                <p>${data.summary}</p>
              </div>

              ${
                data.nextSteps && data.nextSteps.length > 0
                  ? `
                <div class="next-steps">
                  <h3>Recommended Next Steps</h3>
                  <ul>
                    ${data.nextSteps.map((step) => `<li>${step}</li>`).join('')}
                  </ul>
                </div>
              `
                  : ''
              }

              <p>Keep up the great work!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CloserOS. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({ to, subject, html });
  }
}
