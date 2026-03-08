import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq';
import { redis } from '../cache/redis';
import { QueueName } from './queueNames';
import { logger } from '../observability/logger';

export function createQueue(name: QueueName) {
  return new Queue(name, { connection: redis });
}

export function createWorker(name: QueueName, processor: Parameters<typeof Worker>[1]) {
  const worker = new Worker(name, processor as any, { connection: redis });
  const events = new QueueEvents(name, { connection: redis });

  worker.on('failed', (job, err) => {
    logger.error({ queue: name, jobId: job?.id, err }, 'Worker job failed');
  });
  worker.on('completed', (job) => {
    logger.debug({ queue: name, jobId: job.id }, 'Worker job completed');
  });

  events.on('failed', ({ jobId, failedReason }) => {
    logger.error({ queue: name, jobId, failedReason }, 'Queue event failed');
  });

  return { worker, events };
}

export const defaultJobOpts: JobsOptions = {
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
};
