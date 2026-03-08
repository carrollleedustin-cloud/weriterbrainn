import { describe, expect, it, vi } from 'vitest';
import { MemoryService } from '../MemoryService';

vi.mock('../../../infrastructure/ai/Embeddings', () => ({
  getTextEmbedding: vi.fn(async () => [0.1, 0.2, 0.3]),
}));

vi.mock('../../../infrastructure/search/hybrid/hybrid', () => ({
  hybridSearch: vi.fn(async () => [{ id: 'm1', content: 'hello', score: 0.9, tags: [], type: 'SEMANTIC', createdAt: new Date(), importance: 0 }]),
}));

describe('MemoryService', () => {
  it('delegates createMemory to repository', async () => {
    const repo = { createMemory: vi.fn(async () => ({ id: 'm1' })) } as any;
    const svc = new MemoryService(repo);

    const out = await svc.createMemory({ userId: 'u1', type: 'SEMANTIC', content: 'hello' });

    expect(repo.createMemory).toHaveBeenCalledWith({ userId: 'u1', type: 'SEMANTIC', content: 'hello' });
    expect(out).toEqual({ id: 'm1' });
  });

  it('searches memories with embeddings and hybrid search', async () => {
    const repo = { createMemory: vi.fn() } as any;
    const svc = new MemoryService(repo);

    const out = await svc.searchMemories({ userId: 'u1', q: 'hello', k: 5 });

    expect(out.results.length).toBe(1);
    expect(out.results[0].id).toBe('m1');
  });
});
