/**
 * BullMQ job queues. Only available when Redis is configured.
 */
import { Queue, Worker } from "bullmq";
import { config } from "../../config.js";

let connection = null;

function getConnection() {
  if (!config.redisUrl) return null;
  if (!connection) {
    try {
      const url = new URL(config.redisUrl);
      connection = {
        host: url.hostname,
        port: parseInt(url.port || "6379", 10),
        password: url.password || undefined,
        maxRetriesPerRequest: null,
      };
    } catch {
      return null;
    }
  }
  return connection;
}

const QUEUE_NAMES = {
  EMBEDDINGS: "embeddings",
  CONSOLIDATION: "consolidation",
};

export function getQueue(name) {
  const conn = getConnection();
  if (!conn) return null;
  return new Queue(name, {
    connection: conn,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
    },
  });
}

export function createWorker(name, processor, opts = {}) {
  const conn = getConnection();
  if (!conn) return null;
  return new Worker(name, processor, {
    connection: conn,
    concurrency: opts.concurrency ?? 2,
    ...opts,
  });
}

export { QUEUE_NAMES };
export const isQueueAvailable = () => !!getConnection();
