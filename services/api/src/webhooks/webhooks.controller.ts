import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('daily')
  @ApiOperation({ summary: 'Handle Daily.co webhook' })
  async handleDaily(@Body() body: any, @Headers() headers: any) {
    return this.webhooksService.handleDailyWebhook(body);
  }

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  async handleStripe(@Body() body: any, @Headers('stripe-signature') signature: string) {
    return this.webhooksService.handleStripeWebhook(body);
  }

  @Post('calendar/google')
  @ApiOperation({ summary: 'Handle Google Calendar webhook' })
  async handleGoogleCalendar(@Body() body: any) {
    return this.webhooksService.handleCalendarWebhook(body);
  }

  @Post('calendar/outlook')
  @ApiOperation({ summary: 'Handle Outlook Calendar webhook' })
  async handleOutlookCalendar(@Body() body: any) {
    return this.webhooksService.handleCalendarWebhook(body);
  }
}
