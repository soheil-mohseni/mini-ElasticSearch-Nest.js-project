import { Controller } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ElasticService } from './elastic.service';

@Controller('elastic')
export class ElasticController {
  constructor(private readonly elasticService: ElasticService) {}

  @Cron('*/10 * * * * *') // Run every 10 seconds
  async triggerElasticSearch() {
    await this.elasticService.addSearchJob('*');
  }
}
