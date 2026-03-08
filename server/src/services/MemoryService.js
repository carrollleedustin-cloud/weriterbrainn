import { MemoryRepository } from "../repositories/MemoryRepository.js";
import { EmbeddingService } from "./EmbeddingService.js";
import { config } from "../../config.js";
import { logger } from "../lib/logger.js";

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

/** Importance weights by memory type (episodic/semantic/project/goal/belief higher) */
const MEMORY_TYPE_IMPORTANCE = Object.freeze({
  conversation: 0.6,
  note: 0.5,
  idea: 0.6,
  document: 0.5,
  project: 0.75,
  belief: 0.85,
  goal: 0.9,
});

function computeImportance(memoryType, contentLength) {
  const base = MEMORY_TYPE_IMPORTANCE[memoryType] ?? 0.5;
  const lengthBonus = Math.min(0.2, contentLength / 10000 * 0.2);
  return Math.min(1, base + lengthBonus);
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
    const importanceScore = computeImportance(memoryType, content?.length || 0);
    const tier = importanceScore >= 0.7 ? "short_term" : "long_term";
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
      try {
        const embeddings = await this.embeddingService.getEmbeddings(chunks);
        for (let i = 0; i < chunks.length; i++) {
          if (embeddings[i]?.length === config.embeddingDim) {
            await this.memoryRepo.createEmbedding({
              memoryId: memory.id,
              chunkIndex: i,
              chunkText: chunks[i],
              embedding: embeddings[i],
            });
          }
        }
      } catch (err) {
        logger.error("Failed to embed memory chunks", err, { memoryId: memory.id });
      }
    }
    return memory;
  }

  async searchMemories(q, limit = 10, userId = null) {
    if (!q?.trim()) return [];
    const embedding = await this.embeddingService.embedText(q);
    if (!embedding.length) return [];
    return this.memoryRepo.searchSemantic({
      queryEmbedding: embedding,
      userId,
      limit: Math.min(limit, 50),
    });
  }
}
