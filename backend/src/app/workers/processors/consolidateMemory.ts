import { createWorker, createQueue, defaultJobOpts } from '../../../infrastructure/queues/bullmq';
import { QueueNames } from '../../../infrastructure/queues/queueNames';
import { logger } from '../../../infrastructure/observability/logger';
import { prisma } from '../../../infrastructure/db/PrismaClient';
import { openai } from '../../../infrastructure/ai/openai';
import { config } from '../../../lib/config';
const kgQueue = createQueue(QueueNames.KnowledgeGraph);

createWorker(QueueNames.ConsolidateMemory, async (job: { id?: string | number; data: { userId: string } }) => {
  const { userId } = job.data as { userId: string };
  const child = logger.child({ jobId: job.id, userId, queue: QueueNames.ConsolidateMemory });
  try {
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days

    const candidates = await prisma.memory.findMany({
      where: {
        userId,
        OR: [
          { importance: { lt: 0.4 } },
          { createdAt: { lt: cutoff } },
        ],
      },
      select: { id: true, content: true, tags: true, metadata: true, type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Filter out already consolidated memories (metadata.consolidatedInto exists)
    const todo = candidates.filter((m: any) => !((m.metadata as any)?.consolidatedInto));
    if (todo.length < 5) {
      child.info({ count: todo.length }, 'Not enough candidates for consolidation');
      return;
    }

    // Group by first tag (or 'general')
    const groups = new Map<string, typeof todo>();
    for (const m of todo) {
      const key = (m.tags && m.tags.length > 0) ? m.tags[0] : 'general';
      const arr = groups.get(key) ?? [] as any;
      arr.push(m);
      groups.set(key, arr);
    }

    for (const [key, items] of groups.entries()) {
      if (items.length < 5) continue; // threshold

      // Prepare prompt with limited content per item to manage token usage
      const limited = items.slice(-20).map((m: any) => ({ id: m.id, text: m.content.length > 500 ? m.content.slice(0, 500) + '…' : m.content }));
      const sys = `You are a memory consolidation assistant. Merge related user memories into a concise long-term summary.
- Produce 1 short paragraph summary
- Then bullet point key facts/tasks/goals with references to source IDs in brackets like [id:xxxx].
- Be precise and avoid redundancy.`;
      const user = `Topic: ${key}
Memories:
${limited.map((m: any) => `- (${m.id}) ${m.text}`).join('\n')}

Output:`;

      let consolidated = '';
      if (config.openaiApiKey) {
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user },
          ],
          temperature: 0.2,
          max_tokens: 400,
        });
        consolidated = (res.choices[0]?.message?.content ?? '').trim();
      } else {
        // Fallback: naive concatenation
        consolidated = `Summary of ${items.length} memories for ${key}.`;
      }

      if (!consolidated) continue;

      // Create a new long-term summary memory
      const newMem = await prisma.memory.create({
        data: {
          userId,
          type: 'SEMANTIC',
          content: consolidated,
          tags: [key],
          importance: 0.5,
          tier: 'LONG_TERM',
          metadata: {
            citations: items.map((m: any) => m.id),
            consolidatedFromCount: items.length,
            createdBy: 'consolidation',
          } as any,
        },
      });

      // Enqueue KG update for the consolidated memory
      await kgQueue.add('kg-update', { userId, memoryId: newMem.id }, defaultJobOpts);

      // Update source memories with consolidatedInto link
      const nowIso = new Date().toISOString();
      for (const m of items) {
        const meta = (m.metadata as any) ?? {};
        meta.consolidatedInto = newMem.id;
        meta.consolidatedAt = nowIso;
        await prisma.memory.update({ where: { id: m.id }, data: { metadata: meta as any } });
      }

      child.info({ topic: key, consolidatedId: newMem.id, count: items.length }, 'Consolidation completed');
    }
  } catch (err: any) {
    child.error({ err: err?.message }, 'Consolidation failed');
    throw err;
  }
});
