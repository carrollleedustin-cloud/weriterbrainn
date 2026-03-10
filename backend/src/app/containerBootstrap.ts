import { container } from '../container';
import { MemoryRepository } from '../infrastructure/repositories/MemoryRepository';
import { FeedbackRepository } from '../infrastructure/repositories/FeedbackRepository';
import { StrategyRepository } from '../infrastructure/repositories/StrategyRepository';
import { PersonaRepository } from '../infrastructure/repositories/PersonaRepository';
import { MemoryService } from '../services/memory/MemoryService';
import { RagService } from '../services/ai/RagService';
import { FeedbackService } from '../services/analytics/FeedbackService';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { StrategyService } from '../services/analytics/StrategyService';
import { PersonaService } from '../services/persona/PersonaService';
import { GraphService } from '../services/knowledge-graph/GraphService';

export function bootstrapContainer() {
  const memoryRepository = new MemoryRepository();
  container.register('MemoryRepository', memoryRepository);
  container.register('MemoryService', new MemoryService(memoryRepository));

  const strategyRepository = new StrategyRepository();
  container.register('StrategyRepository', strategyRepository);
  const strategyService = new StrategyService(strategyRepository);
  container.register('StrategyService', strategyService);
  container.register('RagService', new RagService(strategyService));

  const feedbackRepository = new FeedbackRepository();
  container.register('FeedbackRepository', feedbackRepository);
  const feedbackService = new FeedbackService(feedbackRepository);
  container.register('FeedbackService', feedbackService);

  container.register('AnalyticsService', new AnalyticsService(feedbackService, strategyService));

  const personaRepository = new PersonaRepository();
  container.register('PersonaRepository', personaRepository);
  container.register('PersonaService', new PersonaService(personaRepository));

  container.register('GraphService', new GraphService());
}
