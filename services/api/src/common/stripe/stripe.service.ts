import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  async createCheckoutSession(params: {
    dealId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              unit_amount: Math.round(params.amount * 100), // Convert to cents
              product_data: {
                name: 'Coaching Package',
                description: `Deal #${params.dealId}`,
              },
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        customer_email: params.customerEmail,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          dealId: params.dealId,
          ...params.metadata,
        },
      });

      this.logger.log(`Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Error creating checkout session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        receipt_email: params.customerEmail,
        metadata: params.metadata,
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`, error.stack);
      throw error;
    }
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      this.logger.error(`Error retrieving session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Error retrieving payment intent: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      this.logger.log(`Refund created: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`, error.stack);
      throw error;
    }
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw error;
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<any> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      case 'payment_intent.succeeded':
        return this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      case 'payment_intent.payment_failed':
        return this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      case 'charge.refunded':
        return this.handleRefund(event.data.object as Stripe.Charge);
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return { received: true };
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Checkout completed: ${session.id}`);
    return {
      type: 'checkout.completed',
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata,
    };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    return {
      type: 'payment.succeeded',
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    return {
      type: 'payment.failed',
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata,
    };
  }

  private async handleRefund(charge: Stripe.Charge) {
    this.logger.log(`Refund processed: ${charge.id}`);
    return {
      type: 'refund.processed',
      chargeId: charge.id,
      amount: charge.amount_refunded / 100,
      currency: charge.currency,
    };
  }
}
