import { MemoryRepository, CreateMemoryInput } from '../../infrastructure/repositories/MemoryRepository';
import { getTextEmbedding } from '../../infrastructure/ai/Embeddings';
import { hybridSearch, MemorySearchFilters, HybridWeights, DecayOptions } from '../../infrastructure/search/hybrid/hybrid';

export interface MemorySearchRequest {
  userId: string;
  q?: string;
  k?: number;
  filters?: MemorySearchFilters;
  weights?: HybridWeights;
  decay?: DecayOptions;
}

export class MemoryService {
  constructor(private memoryRepository: MemoryRepository) {}

  async createMemory(input: CreateMemoryInput) {
    return this.memoryRepository.createMemory(input);
  }

  async searchMemories(req: MemorySearchRequest) {
    const { userId, q, k, filters, weights, decay } = req;
    let queryVec: number[] | undefined;
    if (q && q.trim().length > 0) {
      queryVec = await getTextEmbedding(q);
    }

    const results = await hybridSearch({
      userId,
      queryText: q,
      queryVec,
      k: k ?? 20,
      weights,
      filters,
      decay,
    });

    return { results };
  }
}
