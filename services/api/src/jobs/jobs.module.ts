import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiProcessor } from './ai.processor';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AiModule } from '../common/ai/ai.module';
import { S3Module } from '../common/s3/s3.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai',
    }),
    PrismaModule,
    AiModule,
    S3Module,
  ],
  providers: [AiProcessor],
  exports: [BullModule],
})
export class JobsModule {}
