import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ActivityModule } from '../common/activity/activity.module';

@Module({
  imports: [ActivityModule],
  providers: [LeadsService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
