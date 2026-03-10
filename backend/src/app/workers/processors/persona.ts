import { createWorker } from '../../../infrastructure/queues/bullmq';
import { QueueNames } from '../../../infrastructure/queues/queueNames';
import { logger } from '../../../infrastructure/observability/logger';
import { PersonaRepository } from '../../../infrastructure/repositories/PersonaRepository';
import { PersonaService } from '../../../services/persona/PersonaService';

const persona = new PersonaService(new PersonaRepository());

createWorker(QueueNames.Persona, async (job: { id?: string | number; data: { userId: string } }) => {
  const { userId } = job.data as { userId: string };
  const child = logger.child({ jobId: job.id, userId, queue: QueueNames.Persona });
  try {
    const metrics = await persona.updateProfile(userId);
    child.info({ ttr: metrics.typeTokenRatio, avgLen: metrics.avgSentenceLength }, 'Persona updated');
  } catch (err: any) {
    child.error({ err: err?.message }, 'Persona update failed');
    throw err;
  }
});
