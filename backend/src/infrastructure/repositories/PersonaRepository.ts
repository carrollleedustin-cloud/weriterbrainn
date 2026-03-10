import { prisma } from '../db/PrismaClient';

export interface PersonaMemoryRow {
  content: string;
}

export class PersonaRepository {
  async fetchRecentMemories(userId: string, limit = 200): Promise<PersonaMemoryRow[]> {
    return prisma.memory.findMany({
      where: { userId, type: { in: ['EPISODIC', 'SEMANTIC'] as any } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { content: true },
    });
  }

  async upsertProfile(userId: string, metrics: Record<string, unknown>): Promise<void> {
    await prisma.personaProfile.upsert({
      where: { userId },
      update: { metrics: metrics as any },
      create: { userId, metrics: metrics as any },
    });
  }

  async findProfile(userId: string): Promise<Record<string, unknown> | null> {
    const row = await prisma.personaProfile.findUnique({ where: { userId } });
    return (row?.metrics as Record<string, unknown>) ?? null;
  }
}
