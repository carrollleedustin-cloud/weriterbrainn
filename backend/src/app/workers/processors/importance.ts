import { createWorker, createQueue, defaultJobOpts } from '../../../infrastructure/queues/bullmq';
import { QueueNames } from '../../../infrastructure/queues/queueNames';
import { logger } from '../../../infrastructure/observability/logger';
import { prisma } from '../../../infrastructure/db/PrismaClient';
import { openai } from '../../../infrastructure/ai/openai';
import { config } from '../../../lib/config';
const consolidateQueue = createQueue(QueueNames.ConsolidateMemory);

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function heuristicImportance(text: string): number {
  const t = text.toLowerCase();
  let score = 0.2;

  const urgentTerms = ['todo', 'deadline', 'asap', 'urgent', 'priority', 'milestone'];
  if (urgentTerms.some(w => t.includes(w))) score += 0.2;

  const hasDate = /(\b\d{4}-\d{2}-\d{2}\b)|(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)|(\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b)/i.test(text);
  if (hasDate) score += 0.1;

  const hasNumber = /\d/.test(text);
  if (hasNumber) score += 0.05;

  const len = text.trim().length;
  const lengthFactor = clamp((len - 20) / 380, 0, 1) * 0.15; // 20..400 chars scaled
  score += lengthFactor;

  const hasFirstPerson = /(\bI\b|\bmy\b|\bwe\b|\bour\b)/i.test(text);
  if (hasFirstPerson) score += 0.05;

  const emphatic = /[!?]/.test(text);
  if (emphatic) score += 0.05;

  return clamp(score, 0, 1);
}

async function llmImportance(text: string): Promise<number | null> {
  if (!config.openaiApiKey) return null;
  try {
    const sys = `You rate the importance of a user memory for long-term utility on a scale 0 to 1.
Return ONLY a number between 0 and 1 with up to two decimals. Criteria:
- High: goals, decisions, preferences, projects, deadlines, beliefs, recurring routines.
- Medium: facts, definitions, episodic highlights.
- Low: chit-chat, ephemeral context, one-off greetings.`;
    const user = `Memory: ${text}\nRating:`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0,
      max_tokens: 4,
    });
    const out = res.choices[0]?.message?.content?.trim() ?? '';
    const m = out.match(/\d+(?:\.\d+)?/);
    if (!m) return null;
    const val = parseFloat(m[0]);
    if (Number.isNaN(val)) return null;
    return clamp(val, 0, 1);
  } catch {
    return null;
  }
}

async function llmSummary(text: string): Promise<string | null> {
  if (!config.openaiApiKey) return null;
  try {
    const sys = `Summarize the following user memory in 1-2 concise sentences capturing key facts, tasks, goals, or decisions. Avoid fluff.`;
    const user = `Memory: ${text}`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      max_tokens: 120,
    });
    const out = res.choices[0]?.message?.content?.trim() ?? '';
    return out || null;
  } catch {
    return null;
  }
}

createWorker(QueueNames.Importance, async (job) => {
  const { memoryId } = job.data as { memoryId: string };
  const child = logger.child({ jobId: job.id, memoryId, queue: QueueNames.Importance });
  try {
    const mem = await prisma.memory.findUnique({ where: { id: memoryId }, select: { id: true, content: true, metadata: true, userId: true, createdAt: true } });
    if (!mem) {
      child.warn('Memory not found');
      return;
    }
    const h = heuristicImportance(mem.content);
    const l = await llmImportance(mem.content);
    const final = l != null ? clamp(0.6 * h + 0.4 * l, 0, 1) : h;

    const tier = final >= 0.7 ? 'SHORT_TERM' : 'LONG_TERM';
    await prisma.memory.update({ where: { id: mem.id }, data: { importance: final, tier: tier as any } });
    child.info({ importance: final }, 'Importance stored');

    // Generate a concise summary and store in metadata
    const summary = await llmSummary(mem.content);
    if (summary) {
      const newMeta = { ...((mem.metadata as any) ?? {}), summary, summaryUpdatedAt: new Date().toISOString() };
      await prisma.memory.update({ where: { id: mem.id }, data: { metadata: newMeta as any } });
      child.info('Summary stored');
    }

    // Optionally enqueue consolidation when memory is low-importance or older than 7 days
    const isOld = mem.createdAt ? (Date.now() - new Date(mem.createdAt).getTime()) > 7 * 24 * 60 * 60 * 1000 : false;
    if (final < 0.4 || isOld) {
      await consolidateQueue.add('consolidate', { userId: mem.userId }, defaultJobOpts);
      child.info('Consolidation job enqueued');
    }
  } catch (err: any) {
    child.error({ err: err?.message }, 'Importance computation failed');
    throw err;
  }
});
