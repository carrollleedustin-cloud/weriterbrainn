import { container } from '../container';
import { MemoryRepository } from '../infrastructure/repositories/MemoryRepository';
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
  const strategyService = new StrategyService();
  container.register('StrategyService', strategyService);
  container.register('RagService', new RagService(strategyService));
  const feedbackService = new FeedbackService();
  container.register('FeedbackService', feedbackService);
  container.register('AnalyticsService', new AnalyticsService(feedbackService, strategyService));
  container.register('PersonaService', new PersonaService());
  container.register('GraphService', new GraphService());
}
