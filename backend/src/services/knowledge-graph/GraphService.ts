import { prisma } from '../../infrastructure/db/PrismaClient';
import OpenAI from 'openai';
import { config } from '../../lib/config';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

type ExtractedEntity = { name: string; type: string; aliases?: string[] };

type ExtractedRelation = { type: string; from: string; to: string; weight?: number; metadata?: Record<string, unknown> };

export class GraphService {
  async getNodes(params: { userId: string; q?: string; limit?: number }) {
    const { userId, q, limit = 200 } = params;
    const where: any = { userId };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { canonicalName: { contains: q.toLowerCase() } },
        { type: { contains: q, mode: 'insensitive' } },
      ];
    }
    return prisma.entity.findMany({ where, take: limit, orderBy: { updatedAt: 'desc' } });
  }

  async getEdges(params: { userId: string; entityId?: string; type?: string; limit?: number }) {
    const { userId, entityId, type, limit = 500 } = params;
    const where: any = { userId };
    if (entityId) where.OR = [{ fromId: entityId }, { toId: entityId }];
    if (type) where.type = type;
    return prisma.relationship.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } });
  }

  async extractEntitiesAndRelations(text: string): Promise<{ entities: ExtractedEntity[]; relations: ExtractedRelation[] }> {
    if (!config.openaiApiKey) return { entities: [], relations: [] };
    const sys = `Extract entities and relationships from the provided text.
Return JSON with keys: entities (array of {name, type, aliases?}), relations (array of {type, from, to}). No extra prose.`;
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: text.slice(0, 4000) },
      ],
      temperature: 0,
      max_tokens: 400,
      response_format: { type: 'json_object' } as any,
    } as any);
    const raw = res.choices[0]?.message?.content ?? '{}';
    let data: any = {};
    try { data = JSON.parse(raw); } catch {}
    const entities: ExtractedEntity[] = Array.isArray(data.entities) ? data.entities : [];
    const relations: ExtractedRelation[] = Array.isArray(data.relations) ? data.relations : [];
    return { entities, relations };
  }

  private canonicalKey(userId: string, type: string, name: string) {
    const canonicalName = name.trim().toLowerCase();
    return { canonicalName, key: `${userId}:${type}:${canonicalName}` };
  }

  private normalizeAlias(name: string) {
    return name.trim().toLowerCase();
  }

  async upsertEntity(userId: string, ent: ExtractedEntity) {
    const { canonicalName, key } = this.canonicalKey(userId, ent.type, ent.name);
    const aliasMatch = await prisma.entityAlias.findFirst({ where: { alias: this.normalizeAlias(ent.name) }, include: { entity: true } });
    if (aliasMatch?.entity && aliasMatch.entity.userId === userId) {
      return aliasMatch.entity;
    }
    const existing = await prisma.entity.findUnique({ where: { key } });
    if (existing) return existing;
    const created = await prisma.entity.create({ data: { userId, type: ent.type, name: ent.name, canonicalName, key } });
    if (ent.aliases && ent.aliases.length) {
      for (const alias of ent.aliases) {
        try { await prisma.entityAlias.create({ data: { entityId: created.id, alias: this.normalizeAlias(alias) } }); } catch {}
      }
    }
    // Always add canonical alias for name
    try { await prisma.entityAlias.create({ data: { entityId: created.id, alias: this.normalizeAlias(ent.name) } }); } catch {}
    return created;
  }

  async linkEntitiesByAliases(userId: string, entities: { id: string; name: string; type: string }[], aliases: string[]) {
    // Could be extended to find alias collisions across entities for dedup
    return;
  }

  async upsertRelationship(userId: string, rel: ExtractedRelation, entityMap: Map<string, string>) {
    // Resolve entity names to IDs via entityMap
    const fromId = entityMap.get(rel.from);
    const toId = entityMap.get(rel.to);
    if (!fromId || !toId || fromId === toId) return null;
    const existing = await prisma.relationship.findFirst({ where: { userId, type: rel.type, fromId, toId } });
    if (existing) return existing;
    return prisma.relationship.create({ data: { userId, type: rel.type, fromId, toId, weight: rel.weight ?? 0, metadata: (rel.metadata as any) ?? undefined } });
  }

  extractTimeline(text: string): string[] {
    const matches = text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [];
    return Array.from(new Set(matches));
  }
}
