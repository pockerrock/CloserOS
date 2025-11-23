import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { ActivityModule } from '../common/activity/activity.module';

@Module({
  imports: [ActivityModule],
  providers: [DealsService],
  controllers: [DealsController],
  exports: [DealsService],
})
export class DealsModule {}
