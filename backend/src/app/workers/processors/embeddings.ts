import { createWorker } from '../../../infrastructure/queues/bullmq';
import { QueueNames } from '../../../infrastructure/queues/queueNames';
import { logger } from '../../../infrastructure/observability/logger';
import OpenAI from 'openai';
import { config } from '../../../lib/config';
import { prisma } from '../../../infrastructure/db/PrismaClient';
import { createQueue, defaultJobOpts } from '../../../infrastructure/queues/bullmq';

const openai = new OpenAI({ apiKey: config.openaiApiKey });
const importanceQueue = createQueue(QueueNames.Importance);

createWorker(QueueNames.Embeddings, async (job) => {
  const { memoryId } = job.data as { memoryId: string };
  const child = logger.child({ jobId: job.id, memoryId, queue: QueueNames.Embeddings });
  try {
    const mem = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { id: true, content: true },
    });
    if (!mem) {
      child.warn('Memory not found; skipping');
      return;
    }

    // Compute embedding using OpenAI (1536 dims model)
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: mem.content,
    });
    const vec = embeddingRes.data[0]?.embedding as number[] | undefined;
    if (!vec) {
      throw new Error('Failed to get embedding vector from OpenAI');
    }

    // Persist both Bytes (for backup) and pgvector column
    const vecLiteral = `[${vec.join(',')}]`;
    const bytesHex = Buffer.from(new Float32Array(vec).buffer).toString('hex');

    await prisma.$executeRawUnsafe(
      `UPDATE "Memory" SET embedding = decode($1, 'hex'), embedding_vec = $2::vector WHERE id = $3`,
      bytesHex,
      vecLiteral,
      mem.id
    );

    child.info({ dim: vec.length }, 'Embedding stored');

    // Enqueue importance scoring
    await importanceQueue.add('importance', { memoryId: mem.id }, defaultJobOpts);
    child.info('Importance job enqueued');
  } catch (err: any) {
    child.error({ err: err?.message }, 'Embedding computation failed');
    throw err;
  }
});
