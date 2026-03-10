import { describe, expect, it, vi } from 'vitest';
import { PersonaService } from '../PersonaService';

function mockRepo() {
  return {
    fetchRecentMemories: vi.fn().mockResolvedValue([{ content: 'I love testing. This is great!' }]),
    upsertProfile: vi.fn().mockResolvedValue(undefined),
    findProfile: vi.fn().mockResolvedValue({ tokenCount: 3 }),
  };
}

describe('PersonaService', () => {
  it('computes expanded metrics and upserts profile', async () => {
    const repo = mockRepo();
    const svc = new PersonaService(repo as any);
    const metrics = await svc.updateProfile('user-1');

    expect(repo.fetchRecentMemories).toHaveBeenCalledWith('user-1', 200);
    expect(repo.upsertProfile).toHaveBeenCalledWith('user-1', expect.objectContaining({
      sentenceStructure: expect.any(Object),
      sentimentScore: expect.any(Number),
      formalityScore: expect.any(Number),
    }));
    expect(metrics).toHaveProperty('sentenceStructure');
    expect(metrics).toHaveProperty('sentimentScore');
    expect(metrics).toHaveProperty('formalityScore');
  });

  it('returns profile from repository', async () => {
    const repo = mockRepo();
    const svc = new PersonaService(repo as any);
    const profile = await svc.getProfile('user-1');

    expect(repo.findProfile).toHaveBeenCalledWith('user-1');
    expect(profile).toEqual({ tokenCount: 3 });
  });
});
