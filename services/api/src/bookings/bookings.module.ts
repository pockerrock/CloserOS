import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsScheduler } from './bookings.scheduler';
import { PrismaModule } from '../common/prisma/prisma.module';
import { NotificationsModule } from '../common/notifications/notifications.module';
import { ActivityModule } from '../common/activity/activity.module';
import { CalendarModule } from '../common/calendar/calendar.module';

@Module({
  imports: [PrismaModule, NotificationsModule, ActivityModule, CalendarModule],
  providers: [BookingsService, BookingsScheduler],
  controllers: [BookingsController],
  exports: [BookingsService],
})
export class BookingsModule {}
