import { MemoryService } from "./MemoryService.js";
import { KnowledgeGraphRepository } from "../repositories/KnowledgeGraphRepository.js";
import { ConversationRepository } from "../repositories/ConversationRepository.js";
import { PersonaService } from "./PersonaService.js";

export class RagService {
  constructor({
    memoryService,
    knowledgeGraphRepository,
    conversationRepository,
    personaService,
  }) {
    this.memoryService = memoryService;
    this.kgRepo = knowledgeGraphRepository;
    this.convRepo = conversationRepository;
    this.personaService = personaService;
  }

  async buildContext({ message, userId, conversationId, memoryTopK = 5 }) {
    const [memResults, conversationRecent, kgNodes] = await Promise.all([
      this.memoryService.searchMemories(message, memoryTopK, userId),
      conversationId
        ? this.convRepo.getRecentMessages(conversationId, 6)
        : Promise.resolve([]),
      this.kgRepo.searchEntitiesByText(message, userId, 5),
    ]);

    const memoryChunks = memResults.map((row) => row.chunk_text);

    let kgEntities = [];
    if (kgNodes.length) {
      const relatedIds = await this.kgRepo.findRelatedNodeIds(kgNodes.map((n) => n.id), 3);
      const existingIds = new Set(kgNodes.map((n) => n.id));
      const newIds = relatedIds.filter((id) => !existingIds.has(id));
      const relatedNodes = newIds.length ? await this.kgRepo.findNodesByIds(newIds) : [];
      const allNodes = [...kgNodes, ...relatedNodes].slice(0, 7);
      kgEntities = allNodes.map((n) => {
        const desc = n.description ? ` (${n.description})` : "";
        return `- ${n.name} [${n.node_type}]${desc}`;
      });
    }

    const parts = [];
    if (memoryChunks.length)
      parts.push("Relevant memories:\n" + memoryChunks.map((c) => `- ${c}`).join("\n"));
    if (conversationRecent.length)
      parts.push("Recent conversation:\n" + conversationRecent.join("\n"));
    if (kgEntities.length) parts.push("Related knowledge:\n" + kgEntities.join("\n"));

    const contextStr = parts.length ? parts.join("\n\n") : "(No relevant context found.)";
    const persona = await this.personaService.getPersonaSummary(userId);

    return { contextStr, persona };
  }
}
