import { createWorker } from '../../../infrastructure/queues/bullmq';
import { QueueNames } from '../../../infrastructure/queues/queueNames';
import { logger } from '../../../infrastructure/observability/logger';
import { prisma } from '../../../infrastructure/db/PrismaClient';
import { GraphService } from '../../../services/knowledge-graph/GraphService';

const graph = new GraphService();

createWorker(QueueNames.KnowledgeGraph, async (job) => {
  const { userId, memoryId } = job.data as { userId: string; memoryId: string };
  const child = logger.child({ jobId: job.id, userId, memoryId, queue: QueueNames.KnowledgeGraph });
  try {
    const mem = await prisma.memory.findUnique({ where: { id: memoryId }, select: { id: true, userId: true, content: true } });
    if (!mem) {
      child.warn('Memory not found');
      return;
    }
    const { entities, relations } = await graph.extractEntitiesAndRelations(mem.content);
    const dates = graph.extractTimeline(mem.content);

    // Upsert entities and map names->IDs
    const entityMap = new Map<string, string>();
    for (const e of entities) {
      const ent = await graph.upsertEntity(userId, e);
      entityMap.set(e.name, ent.id);
      try {
        await prisma.memoryEntity.create({ data: { memoryId: mem.id, entityId: ent.id, userId } });
      } catch {}
    }

    // Inferred co-occurrence relationships
    const entIds = Array.from(entityMap.values());
    for (let i = 0; i < entIds.length; i++) {
      for (let j = i + 1; j < entIds.length; j++) {
        await graph.upsertRelationship(userId, { type: 'CO_OCCURS', from: entities[i]?.name ?? '', to: entities[j]?.name ?? '', metadata: { inferred: true, memoryId: mem.id } }, entityMap);
      }
    }

    // Upsert relationships with timeline metadata
    for (const r of relations) {
      const meta = dates.length ? { ...(r.metadata ?? {}), dates } : r.metadata;
      await graph.upsertRelationship(userId, { ...r, metadata: meta }, entityMap);
    }

    child.info({ entities: entities.length, relations: relations.length }, 'KG updated');
  } catch (err: any) {
    child.error({ err: err?.message }, 'KG update failed');
    throw err;
  }
});
