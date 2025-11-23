import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from '../common/stripe/stripe.service';
import { DealStage } from '@prisma/client';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async handleDailyWebhook(event: any) {
    this.logger.log('Daily webhook received:', event.type);

    try {
      switch (event.type) {
        case 'recording.ready':
          return this.handleRecordingReady(event.data);
        default:
          this.logger.log(`Unhandled Daily event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Daily webhook: ${error.message}`, error.stack);
    }

    return { received: true };
  }

  async handleStripeWebhook(event: any) {
    this.logger.log(`Stripe webhook received: ${event.type}`);

    try {
      const webhookData = await this.stripeService.handleWebhookEvent(event);

      switch (webhookData.type) {
        case 'checkout.completed':
          return this.handleCheckoutCompleted(webhookData);
        case 'payment.succeeded':
          return this.handlePaymentSucceeded(webhookData);
        case 'payment.failed':
          return this.handlePaymentFailed(webhookData);
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe webhook: ${error.message}`, error.stack);
    }

    return { received: true };
  }

  async handleCalendarWebhook(event: any) {
    this.logger.log('Calendar webhook received');
    // TODO: Process Calendar webhook events
    return { received: true };
  }

  private async handleCheckoutCompleted(data: any) {
    const { sessionId, metadata } = data;

    if (!metadata?.dealId) {
      this.logger.warn('No dealId in checkout session metadata');
      return { received: true };
    }

    // Update deal to PAID
    await this.prisma.deal.update({
      where: { id: metadata.dealId },
      data: {
        stage: DealStage.PAID,
        stripePaymentId: sessionId,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Deal ${metadata.dealId} marked as PAID`);
    return { received: true, dealId: metadata.dealId };
  }

  private async handlePaymentSucceeded(data: any) {
    const { paymentIntentId, metadata } = data;

    if (metadata?.dealId) {
      await this.prisma.deal.update({
        where: { id: metadata.dealId },
        data: {
          stage: DealStage.PAID,
          stripePaymentId: paymentIntentId,
          paidAt: new Date(),
        },
      });

      this.logger.log(`Deal ${metadata.dealId} payment succeeded`);
    }

    return { received: true };
  }

  private async handlePaymentFailed(data: any) {
    const { metadata } = data;

    if (metadata?.dealId) {
      this.logger.warn(`Payment failed for deal ${metadata.dealId}`);
      // TODO: Send notification to closer
    }

    return { received: true };
  }

  private async handleRecordingReady(data: any) {
    // Extract call ID from room name (format: call-{callId})
    const roomName = data.room_name;
    const callId = roomName?.replace('call-', '');

    if (!callId) {
      this.logger.warn('Could not extract callId from room name');
      return { received: true };
    }

    // Update call with recording URL
    await this.prisma.call.update({
      where: { id: callId },
      data: {
        recordingUrl: data.download_url,
        recordingReady: true,
      },
    });

    this.logger.log(`Recording ready for call ${callId}`);

    // TODO: Trigger STT processing job
    return { received: true, callId };
  }
}
