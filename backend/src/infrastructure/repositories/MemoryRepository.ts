import { prisma } from '../db/PrismaClient';
import { createQueue, defaultJobOpts } from '../queues/bullmq';
import { QueueNames } from '../queues/queueNames';

const embeddingsQueue = createQueue(QueueNames.Embeddings);
const kgQueue = createQueue(QueueNames.KnowledgeGraph);
const personaQueue = createQueue(QueueNames.Persona);

export type MemoryType = 'EPISODIC' | 'SEMANTIC' | 'PROJECT' | 'GOAL' | 'BELIEF';

export interface CreateMemoryInput {
  userId: string;
  type: MemoryType;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export class MemoryRepository {
  async createMemory(input: CreateMemoryInput) {
    const mem = await prisma.memory.create({
      data: {
        userId: input.userId,
        type: input.type as any,
        content: input.content,
        tags: input.tags ?? [],
        metadata: input.metadata as any,
      },
    });

    await embeddingsQueue.add('embed-memory', { memoryId: mem.id }, defaultJobOpts);
    await kgQueue.add('kg-update', { userId: input.userId, memoryId: mem.id }, defaultJobOpts);
    await personaQueue.add('persona', { userId: input.userId }, defaultJobOpts);
    return mem;
  }

  async setEmbedding(memoryId: string, embedding: number[]) {
    // Store embedding both in prisma Bytes and pgvector column using parameterized query
    const bytesHex = Buffer.from(new Float32Array(embedding).buffer).toString('hex');
    const vecLiteral = `[${embedding.join(',')}]`;
    await prisma.$executeRaw`UPDATE "Memory" SET embedding = decode(${bytesHex}, 'hex'), embedding_vec = ${vecLiteral}::vector WHERE id = ${memoryId}`;
  }
}
