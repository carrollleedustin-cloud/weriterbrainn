/**
 * Simple dependency injection container.
 * Wires repositories, services, and modules.
 */
import { UserRepository } from "./repositories/UserRepository.js";
import { MemoryRepository } from "./repositories/MemoryRepository.js";
import { ConversationRepository } from "./repositories/ConversationRepository.js";
import { KnowledgeGraphRepository } from "./repositories/KnowledgeGraphRepository.js";
import { PersonaRepository } from "./repositories/PersonaRepository.js";
import { AnalyticsRepository } from "./repositories/AnalyticsRepository.js";

import { EmbeddingService } from "./services/EmbeddingService.js";
import { MemoryService } from "./services/MemoryService.js";
import { ExtractionService } from "./services/ExtractionService.js";
import { PersonaService } from "./services/PersonaService.js";
import { RagService } from "./services/RagService.js";
import { ChatService } from "./services/ChatService.js";

// Repositories
const userRepository = new UserRepository();
const memoryRepository = new MemoryRepository();
const conversationRepository = new ConversationRepository();
const knowledgeGraphRepository = new KnowledgeGraphRepository();
const personaRepository = new PersonaRepository();
const analyticsRepository = new AnalyticsRepository();

// Services
const embeddingService = new EmbeddingService();
const memoryService = new MemoryService({
  memoryRepository,
  embeddingService,
});
const extractionService = new ExtractionService({
  knowledgeGraphRepository,
});
const personaService = new PersonaService({
  personaRepository,
});
const ragService = new RagService({
  memoryService,
  knowledgeGraphRepository,
  conversationRepository,
  personaService,
});
const chatService = new ChatService({
  ragService,
});

export const container = {
  // Repositories
  userRepository,
  memoryRepository,
  conversationRepository,
  knowledgeGraphRepository,
  personaRepository,
  analyticsRepository,

  // Services
  embeddingService,
  memoryService,
  extractionService,
  personaService,
  ragService,
  chatService,
};
