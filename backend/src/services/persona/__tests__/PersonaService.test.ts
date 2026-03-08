import { describe, expect, it, vi } from 'vitest';

const findMany = vi.fn().mockResolvedValue([{ content: 'I love testing. This is great!' }]);
const upsert = vi.fn().mockResolvedValue({});
const findUnique = vi.fn().mockResolvedValue({ metrics: { tokenCount: 3 } });

vi.mock('../../../infrastructure/db/PrismaClient', () => ({
  prisma: {
    memory: { findMany },
    personaProfile: { upsert, findUnique },
  },
}));

import { PersonaService } from '../PersonaService';

describe('PersonaService', () => {
  it('computes expanded metrics and upserts profile', async () => {
    const svc = new PersonaService();
    const metrics = await svc.updateProfile('user-1');

    expect(metrics).toHaveProperty('sentenceStructure');
    expect(metrics).toHaveProperty('sentimentScore');
    expect(metrics).toHaveProperty('formalityScore');
    expect(upsert).toHaveBeenCalled();
  });
});
