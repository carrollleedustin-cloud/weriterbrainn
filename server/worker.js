#!/usr/bin/env node
/**
 * Background worker for BullMQ jobs.
 * Run: npm run worker
 * Requires REDIS_URL. Processes: embeddings, consolidation.
 */
import { createWorker } from "./src/lib/queue.js";
import { QUEUE_NAMES } from "./src/lib/queue.js";
import { runWithContext } from "./src/lib/requestContext.js";
import { logger } from "./src/lib/logger.js";
import { container } from "./src/container.js";

async function processEmbeddings(job) {
  const { memoryId, chunks, userId } = job.data;
  if (!memoryId || !chunks?.length || !userId) {
    logger.warn("Embeddings job missing data", { jobId: job.id });
    return;
  }
  await runWithContext(userId, async () => {
    const embeddings = await container.embeddingService.getEmbeddings(
      chunks.map((c) => c.text)
    );
    for (let i = 0; i < chunks.length; i++) {
      if (embeddings[i]?.length) {
        await container.memoryRepository.createEmbedding({
          memoryId,
          chunkIndex: chunks[i].index,
          chunkText: chunks[i].text,
          embedding: embeddings[i],
        });
      }
    }
    logger.info("Embeddings job completed", { memoryId, chunks: chunks.length });
  });
}

async function processConsolidation(job) {
  const { userId, olderThanDays, batchLimit } = job.data;
  const { runConsolidation } = await import("./src/workers/ConsolidationWorker.js");
  const result = await runConsolidation(userId, {
    olderThanDays: olderThanDays ?? 7,
    batchLimit: batchLimit ?? 20,
  });
  logger.info("Consolidation job completed", { userId, ...result });
}

function main() {
  const connWorker = createWorker(QUEUE_NAMES.EMBEDDINGS, processEmbeddings);
  const consolidWorker = createWorker(QUEUE_NAMES.CONSOLIDATION, processConsolidation);

  if (!connWorker || !consolidWorker) {
    logger.error("Worker failed to start: REDIS_URL required");
    process.exit(1);
  }

  connWorker.on("completed", (job) => logger.debug("Embeddings job done", { jobId: job.id }));
  connWorker.on("failed", (job, err) => logger.error("Embeddings job failed", err, { jobId: job?.id }));
  consolidWorker.on("completed", (job) => logger.debug("Consolidation job done", { jobId: job.id }));
  consolidWorker.on("failed", (job, err) => logger.error("Consolidation job failed", err, { jobId: job?.id }));

  logger.info("Worker started", { queues: [QUEUE_NAMES.EMBEDDINGS, QUEUE_NAMES.CONSOLIDATION] });

  process.on("SIGTERM", async () => {
    await connWorker.close();
    await consolidWorker.close();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error("Worker crash", err);
  process.exit(1);
});
