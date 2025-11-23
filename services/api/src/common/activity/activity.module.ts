import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
