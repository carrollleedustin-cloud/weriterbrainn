import { MemoryRepository } from "../repositories/MemoryRepository.js";
import { EmbeddingService } from "./EmbeddingService.js";
import { config } from "../../config.js";
import { logger } from "../lib/logger.js";
import { getQueue, isQueueAvailable } from "../lib/queue.js";
import { QUEUE_NAMES } from "../lib/queue.js";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

/** Base importance by memory type. Semantic types (belief, goal) are structurally important. */
const MEMORY_TYPE_IMPORTANCE = Object.freeze({
  conversation: 0.55,
  note: 0.5,
  idea: 0.65,
  document: 0.55,
  project: 0.75,
  belief: 0.9,
  goal: 0.95,
});

/** Content signals that boost importance (case-insensitive substrings) */
const IMPORTANCE_SIGNALS = [
  { pattern: /\b(I believe|I think that|my belief|core value)\b/i, boost: 0.15 },
  { pattern: /\b(my goal|I want to|objective|priority)\b/i, boost: 0.12 },
  { pattern: /\b(important|critical|essential|key)\b/i, boost: 0.05 },
  { pattern: /\b(remember|never forget|always)\b/i, boost: 0.08 },
];

function computeContentSignalBoost(content) {
  if (!content?.trim()) return 0;
  let boost = 0;
  for (const { pattern, boost: b } of IMPORTANCE_SIGNALS) {
    if (pattern.test(content)) boost += b;
  }
  return Math.min(0.2, boost);
}

function computeImportance(memoryType, content, contentLength) {
  const base = MEMORY_TYPE_IMPORTANCE[memoryType] ?? 0.5;
  const lengthBonus = Math.min(0.12, (contentLength || 0) / 8000 * 0.12);
  const signalBonus = computeContentSignalBoost(content);
  return Math.min(1, base + lengthBonus + signalBonus);
}

/**
 * Determine tier: short_term = hot/recent/episodic; long_term = semantic/consolidated.
 * Beliefs and goals are always long_term; conversation starts short_term.
 */
function computeTier(memoryType, importanceScore) {
  const semanticTypes = ["belief", "goal", "project", "document"];
  if (semanticTypes.includes(memoryType)) return "long_term";
  if (memoryType === "conversation" || memoryType === "note" || memoryType === "idea") {
    return importanceScore >= 0.75 ? "long_term" : "short_term";
  }
  return "short_term";
}

function chunkText(text) {
  if (!text?.trim()) return [];
  if (text.length <= CHUNK_SIZE) return [text.trim()];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    let chunk = text.slice(start, end);
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > CHUNK_SIZE / 2) {
        end = start + lastSpace + 1;
        chunk = text.slice(start, end);
      }
    }
    const trimmed = chunk.trim();
    if (trimmed) chunks.push(trimmed);
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

export class MemoryService {
  constructor({ memoryRepository, embeddingService }) {
    this.memoryRepo = memoryRepository;
    this.embeddingService = embeddingService;
  }

  async storeMemory(content, memoryType = "note", title = null, userId = null) {
    const importanceScore = computeImportance(memoryType, content, content?.length || 0);
    const tier = computeTier(memoryType, importanceScore);
    const memory = await this.memoryRepo.create({
      content,
      memoryType,
      title,
      userId,
      importanceScore,
      tier,
    });
    const chunks = chunkText(content);
    if (chunks.length && config.openaiApiKey) {
      const useQueue = config.useEmbeddingQueue && isQueueAvailable();
      if (useQueue) {
        try {
          const q = getQueue(QUEUE_NAMES.EMBEDDINGS);
          await q.add(
            "embed",
            {
              memoryId: memory.id,
              chunks: chunks.map((text, index) => ({ index, text })),
              userId,
            },
            { jobId: memory.id }
          );
          logger.info("Embedding job queued", { memoryId: memory.id });
        } catch (err) {
          logger.error("Failed to queue embedding job, falling back to inline", err, {
            memoryId: memory.id,
          });
          await this.embedInline(memory.id, chunks, userId);
        }
      } else {
        await this.embedInline(memory.id, chunks, userId);
      }
    }
    return memory;
  }

  async embedInline(memoryId, chunks, userId) {
    try {
      const embeddings = await this.embeddingService.getEmbeddings(chunks);
      for (let i = 0; i < chunks.length; i++) {
        if (embeddings[i]?.length === config.embeddingDim) {
          await this.memoryRepo.createEmbedding({
            memoryId,
            chunkIndex: i,
            chunkText: chunks[i],
            embedding: embeddings[i],
          });
        }
      }
    } catch (err) {
      logger.error("Failed to embed memory chunks", err, { memoryId });
    }
  }

  async searchMemories(q, limit = 10, userId = null, filters = {}) {
    if (!q?.trim()) return [];
    const embedding = await this.embeddingService.embedText(q);
    if (!embedding.length) return [];
    return this.memoryRepo.searchSemantic({
      queryEmbedding: embedding,
      userId,
      limit: Math.min(limit, 100),
      queryText: q,
      memoryType: filters.memory_type,
      tier: filters.tier,
    });
  }
}
