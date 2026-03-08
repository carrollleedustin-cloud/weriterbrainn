import { logger } from '../../infrastructure/observability/logger';
import './processors/embeddings';
import './processors/consolidateMemory';
import './processors/importance';
import './processors/knowledgeGraph';
import './processors/persona';

logger.info({ workers: ['embeddings', 'consolidateMemory', 'importance', 'knowledgeGraph', 'persona'] }, 'Workers started');
