/**
 * Simple dependency injection container.
 * Wires repositories, services, and modules.
 */
import { UserRepository } from "./repositories/UserRepository.js";
import { MemoryRepository } from "./repositories/MemoryRepository.js";
import { ConversationRepository } from "./repositories/ConversationRepository.js";
import { KnowledgeGraphRepository } from "./repositories/KnowledgeGraphRepository.js";
import { NarrativeRepository } from "./repositories/NarrativeRepository.js";
import { PersonaRepository } from "./repositories/PersonaRepository.js";
import { AnalyticsRepository } from "./repositories/AnalyticsRepository.js";

import { EmbeddingService } from "./services/EmbeddingService.js";
import { MemoryService } from "./services/MemoryService.js";
import { ExtractionService } from "./services/ExtractionService.js";
import { NarrativeExtractionService } from "./services/NarrativeExtractionService.js";
import { StoryCompilerService } from "./services/StoryCompilerService.js";
import { TimelineService } from "./services/TimelineService.js";
import { PlotThreadService } from "./services/PlotThreadService.js";
import { StoryQAService } from "./services/StoryQAService.js";
import { StoryStrategistService } from "./services/StoryStrategistService.js";
import { CharacterService } from "./services/CharacterService.js";
import { ConsequencePreviewService } from "./services/ConsequencePreviewService.js";
import { PersonaService } from "./services/PersonaService.js";
import { RagService } from "./services/RagService.js";
import { ChatService } from "./services/ChatService.js";

// Repositories
const userRepository = new UserRepository();
const memoryRepository = new MemoryRepository();
const conversationRepository = new ConversationRepository();
const knowledgeGraphRepository = new KnowledgeGraphRepository();
const narrativeRepository = new NarrativeRepository();
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
  embeddingService,
});
const narrativeExtractionService = new NarrativeExtractionService({
  narrativeRepository,
  embeddingService,
});
const storyCompilerService = new StoryCompilerService({
  narrativeRepository,
  narrativeExtractionService,
});
const timelineService = new TimelineService({ narrativeRepository });
const plotThreadService = new PlotThreadService({ narrativeRepository });
const storyQAService = new StoryQAService({
  narrativeRepository,
  embeddingService,
});
const storyStrategistService = new StoryStrategistService({
  narrativeRepository,
  plotThreadService,
});
const characterService = new CharacterService({ narrativeRepository });
const consequencePreviewService = new ConsequencePreviewService({
  narrativeRepository,
  storyCompilerService,
});
const personaService = new PersonaService({
  personaRepository,
});
const ragService = new RagService({
  memoryService,
  knowledgeGraphRepository,
  conversationRepository,
  personaService,
  embeddingService,
  narrativeRepository,
});
const chatService = new ChatService({
  ragService,
  personaService,
});

export const container = {
  // Repositories
  userRepository,
  memoryRepository,
  conversationRepository,
  knowledgeGraphRepository,
  narrativeRepository,
  personaRepository,
  analyticsRepository,

  // Services
  embeddingService,
  memoryService,
  extractionService,
  narrativeExtractionService,
  storyCompilerService,
  timelineService,
  plotThreadService,
  storyQAService,
  storyStrategistService,
  characterService,
  consequencePreviewService,
  personaService,
  ragService,
  chatService,
};
