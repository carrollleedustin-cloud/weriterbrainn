import { prisma } from '../../infrastructure/db/PrismaClient';

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-zA-Z']+/g) ?? [];
}

function sentenceSplit(text: string) {
  return text.split(/[.!?]+\s/).map(s => s.trim()).filter(Boolean);
}

function typeTokenRatio(tokens: string[]) {
  if (tokens.length === 0) return 0;
  const unique = new Set(tokens);
  return unique.size / tokens.length;
}

function avgSentenceLength(sents: string[]) {
  if (sents.length === 0) return 0;
  const lens = sents.map(s => s.split(/\s+/).filter(Boolean).length);
  return lens.reduce((a, b) => a + b, 0) / lens.length;
}

function toneHeuristics(text: string) {
  const t = text.toLowerCase();
  const positive = (t.match(/\b(great|good|love|awesome|excellent|happy|win|success)\b/g) || []).length;
  const negative = (t.match(/\b(bad|hate|terrible|awful|sad|fail|problem)\b/g) || []).length;
  const exclaim = (t.match(/!/g) || []).length;
  const question = (t.match(/\?/g) || []).length;
  return { positive, negative, exclaim, question };
}

function sentimentScore(tone: { positive: number; negative: number }) {
  const total = tone.positive + tone.negative;
  if (total === 0) return 0;
  return (tone.positive - tone.negative) / total;
}

function sentenceStructureProfile(sents: string[]) {
  const lengths = sents.map(s => s.split(/\s+/).filter(Boolean).length);
  const short = lengths.filter(l => l <= 6).length;
  const medium = lengths.filter(l => l > 6 && l <= 16).length;
  const long = lengths.filter(l => l > 16).length;
  return {
    count: sents.length,
    shortPct: sents.length ? short / sents.length : 0,
    mediumPct: sents.length ? medium / sents.length : 0,
    longPct: sents.length ? long / sents.length : 0,
  };
}

function formalityScore(tokens: string[]) {
  const slang = new Set(['lol', 'lmao', 'idk', 'btw', 'imo', 'imho', 'omg', 'brb', 'btw']);
  const contractions = tokens.filter(t => t.includes("'")).length;
  const slangCount = tokens.filter(t => slang.has(t)).length;
  const raw = 1 - Math.min(1, (slangCount + contractions) / Math.max(1, tokens.length));
  return raw;
}

export class PersonaService {
  async updateProfile(userId: string) {
    // Pull last N user-authored memories (episodic + semantic)
    const mems = await prisma.memory.findMany({
      where: { userId, type: { in: ['EPISODIC', 'SEMANTIC'] as any } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { content: true },
    });

    const texts = mems.map((m: { content: string }) => m.content).join('\n');
    const tokens = tokenize(texts);
    const sents = sentenceSplit(texts);

    const tone = toneHeuristics(texts);
    const metrics = {
      tokenCount: tokens.length,
      typeTokenRatio: typeTokenRatio(tokens),
      avgSentenceLength: avgSentenceLength(sents),
      sentenceStructure: sentenceStructureProfile(sents),
      tone,
      sentimentScore: sentimentScore(tone),
      formalityScore: formalityScore(tokens),
      vocabTop: Array.from(tokens.reduce((m, w) => m.set(w, (m.get(w) || 0) + 1), new Map<string, number>()))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([w, c]) => ({ w, c })),
      updatedAt: new Date().toISOString(),
    };

    await prisma.personaProfile.upsert({
      where: { userId },
      update: { metrics: metrics as any },
      create: { userId, metrics: metrics as any },
    });

    return metrics;
  }

  async getProfile(userId: string) {
    const p = await prisma.personaProfile.findUnique({ where: { userId } });
    return p?.metrics ?? null;
  }
}
