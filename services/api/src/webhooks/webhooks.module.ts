import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
