import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';

@Injectable()
export class ElasticService {
  private readonly esClient: Client;
  private readonly logger = new Logger(ElasticService.name);

  constructor(
    @InjectQueue('searchQueue') private readonly searchQueue: Queue, // Inject Bull queue
  ) {
    this.esClient = new Client({
      node: 'https://username:password@host:port', // elastic search config
    });
  }

  async searchWithPIT(index: string) {
    try {
      // Step 1: Open a Point-in-Time context (PIT)
      const pitResponse: any = await this.esClient.openPointInTime({
        index,
        keep_alive: '1m',
      });

      // Log the full response to inspect it
      if (!pitResponse || !pitResponse.id) {
        throw new Error('PIT ID is undefined. Unable to proceed.');
      }

      const pitId = pitResponse.id;

      // Step 2: Execute search query using PIT
      const searchResponse: any = await this.esClient.search({
        body: {
          track_total_hits: true,
          size: 3,
          version: true,
          pit: {
            id: pitId,
            keep_alive: '1m',
          },
          highlight: {
            pre_tags: ['@kibana-highlighted-field@'],
            post_tags: ['@/kibana-highlighted-field@'],
            fields: {
              '*': {},
            },
            fragment_size: 2147483647,
          },
        },
      });

      // Step 3: Close the PIT when done
      await this.esClient.closePointInTime({ body: { id: pitId } });
      this.logger.log('Search completed successfully.');

      return searchResponse;
    } catch (error) {
      this.logger.error('Error performing PIT query:', error.message);
      throw error;
    }
  }

  async addSearchJob(index: string) {
    // Add the job to the queue
    await this.searchQueue.add('elasticSearch', { index });
    this.logger.log(`Job added to the queue for index: ${index}`);
  }
}
