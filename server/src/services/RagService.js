import { MemoryService } from "./MemoryService.js";
import { KnowledgeGraphRepository } from "../repositories/KnowledgeGraphRepository.js";
import { ConversationRepository } from "../repositories/ConversationRepository.js";
import { PersonaService } from "./PersonaService.js";
import { MEMORY_TYPE_CONTEXT_PRIORITY } from "../domain/index.js";
import { rewriteQueryForRetrieval } from "../lib/queryRewriter.js";
import { diversityRerank } from "../lib/reranker.js";
import { assembleUnderBudget } from "../lib/tokenBudget.js";
import { config } from "../../config.js";

export class RagService {
  constructor({
    memoryService,
    knowledgeGraphRepository,
    conversationRepository,
    personaService,
    embeddingService,
    narrativeRepository = null,
  }) {
    this.memoryService = memoryService;
    this.kgRepo = knowledgeGraphRepository;
    this.convRepo = conversationRepository;
    this.personaService = personaService;
    this.embeddingService = embeddingService;
    this.narrativeRepo = narrativeRepository;
  }

  async buildNarrativeSummary(userId) {
    if (!this.narrativeRepo || !userId) return "";
    try {
      const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
      const [objects, canonEvents] = await Promise.all([
        this.narrativeRepo.findObjectsByProject(project.id),
        this.narrativeRepo.findCanonLedgerEvents(project.id, 15),
      ]);
      const chars = objects.filter((o) => (o.object_type || "").toLowerCase() === "character");
      const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");
      const facts = canonEvents
        .filter((e) => (e.event_type || "").toLowerCase() === "canon_established")
        .map((e) => e.payload?.fact)
        .filter(Boolean)
        .slice(0, 5);
      if (chars.length === 0 && threads.length === 0 && facts.length === 0) return "";
      const parts = [];
      if (chars.length) parts.push(`Characters: ${chars.map((c) => c.name).join(", ")}`);
      if (threads.length) parts.push(`Plot threads: ${threads.map((t) => t.name).join(", ")}`);
      if (facts.length) parts.push(`Canon: ${facts.join("; ")}`);
      return "Story universe: " + parts.join(". ");
    } catch {
      return "";
    }
  }

  async buildContext({
    message,
    userId,
    conversationId,
    memoryTopK = 5,
    maxContextTokens,
    queryRewrite,
    rerank,
  } = {}) {
    const maxTokens = maxContextTokens ?? config.maxContextTokens ?? 3500;
    const doRewrite = queryRewrite ?? config.queryRewrite ?? false;
    const doRerank = rerank ?? config.rerank ?? false;

    const searchQuery = doRewrite
      ? await rewriteQueryForRetrieval(message)
      : message;

    let memResults = await this.memoryService.searchMemories(
      searchQuery,
      doRerank ? memoryTopK * 3 : memoryTopK * 2,
      userId
    );
    if (doRerank && memResults.length > memoryTopK) {
      memResults = diversityRerank(memResults, {
        lambda: 0.7,
        topK: memoryTopK * 2,
      });
    }

    const [conversationRecent, kgNodes] = await Promise.all([
      conversationId
        ? this.convRepo.getRecentMessages(conversationId, 6)
        : Promise.resolve([]),
      this.searchEntities(searchQuery, userId, 5),
    ]);

    const { chunks: memoryChunks, citations } = assembleMemoryContext(memResults, memoryTopK);

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

    const memoryStr =
      memoryChunks.length > 0
        ? "Relevant memories:\n" + memoryChunks.map((c) => `- ${c}`).join("\n")
        : "";
    const convStr =
      conversationRecent.length > 0
        ? "Recent conversation:\n" + conversationRecent.join("\n")
        : "";
    const kgStr =
      kgEntities.length > 0
        ? "Related knowledge:\n" + kgEntities.join("\n")
        : "";
    const narrativeStr = await this.buildNarrativeSummary(userId);

    const segments = [narrativeStr, memoryStr, convStr, kgStr].filter(Boolean);
    const contextStr =
      segments.length > 0
        ? assembleUnderBudget(
            segments.map((s) => ({ text: s })),
            maxTokens - 200,
            { prefix: "", item: "\n\n" }
          )
        : "(No relevant context found.)";
    const persona = await this.personaService.getPersonaSummary(userId);

    return { contextStr, persona, citations };
  }

  /** Semantic search when nodes have embeddings; else ILIKE fallback. */
  async searchEntities(searchQuery, userId, limit) {
    if (!searchQuery?.trim() || !userId) return [];
    if (this.embeddingService) {
      try {
        const embedding = await this.embeddingService.embedText(searchQuery);
        if (embedding?.length) {
          const rows = await this.kgRepo.searchEntitiesSemantic({
            queryEmbedding: embedding,
            userId,
            limit,
          });
          if (rows.length > 0) return rows;
        }
      } catch {
        /* fall through to ILIKE */
      }
    }
    return this.kgRepo.searchEntitiesByText(searchQuery, userId, limit);
  }
}

/**
 * Assemble memory context with type-aware ordering, labels, and numbered citations.
 * Orders by: belief > goal > project > idea > note/document > conversation.
 * Returns { chunks, citations } for use in prompt and response.
 */
function assembleMemoryContext(rows, topK) {
  const citations = [];
  if (!rows?.length) return { chunks: [], citations };
  const withType = rows.map((r) => ({
    ...r,
    memory_type_lower: (r.memory_type || "").toLowerCase(),
  }));
  const priority = (r) => MEMORY_TYPE_CONTEXT_PRIORITY[r.memory_type_lower] ?? 0;
  withType.sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pb - pa;
    return (b.score ?? 0) - (a.score ?? 0);
  });
  const seen = new Set();
  const labeled = [];
  let index = 1;
  for (const r of withType) {
    if (labeled.length >= topK) break;
    const key = `${r.id}:${r.chunk_text?.slice(0, 50)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const typeLabel = r.memory_type_lower ? `[${r.memory_type_lower}]` : "";
    const text = typeLabel ? `${typeLabel} ${r.chunk_text}`.trim() : r.chunk_text;
    labeled.push(`${index}. ${text}`);
    citations.push({
      index,
      memory_id: r.id,
      chunk_text: (r.chunk_text || "").slice(0, 300),
    });
    index++;
  }
  return { chunks: labeled, citations };
}
