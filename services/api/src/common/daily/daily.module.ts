import { Global, Module } from '@nestjs/common';
import { DailyService } from './daily.service';

@Global()
@Module({
  providers: [DailyService],
  exports: [DailyService],
})
export class DailyModule {}
