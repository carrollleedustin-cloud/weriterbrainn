export interface RerankItem {
  id: string;
  text: string;
}

export interface RerankResult {
  id: string;
  score: number; // normalized 0..1
}

export interface IRerankerClient {
  rerank(query: string, items: RerankItem[], topN?: number): Promise<RerankResult[]>;
}

// No-op reranker that preserves original order and gives descending linear scores
export class NoopReranker implements IRerankerClient {
  async rerank(query: string, items: RerankItem[], topN: number = 20): Promise<RerankResult[]> {
    const n = Math.min(topN, items.length);
    return items.slice(0, n).map((it, idx) => ({ id: it.id, score: (n - idx) / n }));
  }
}

// Placeholder for third-party rerankers (Cohere, local cross-encoder, etc.)
export class CohereReranker implements IRerankerClient {
  private apiKey?: string;
  constructor(apiKey?: string) { this.apiKey = apiKey; }
  async rerank(query: string, items: RerankItem[], topN: number = 20): Promise<RerankResult[]> {
    if (!this.apiKey) {
      const noop = new NoopReranker();
      return noop.rerank(query, items, topN);
    }
    // TODO: integrate real Cohere Rerank API
    const noop = new NoopReranker();
    return noop.rerank(query, items, topN);
  }
}
