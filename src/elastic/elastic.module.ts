import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ElasticService } from './elastic.service';
import { ElasticController } from './elastic.controller';
import { SearchProcessor } from 'src/bullmq/bullmq';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'searchQueue',
    }),
  ],
  controllers: [ElasticController],
  providers: [ElasticService, SearchProcessor],
})
export class ElasticModule {}
