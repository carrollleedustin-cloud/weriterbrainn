import { PersonaRepository } from "../repositories/PersonaRepository.js";

function avgSentenceLength(text) {
  const sents = text.split(/[.!?]+/).filter((s) => s.trim());
  if (!sents.length) return 0;
  const total = sents.reduce((sum, s) => sum + s.trim().split(/\s+/).filter(Boolean).length, 0);
  return total / sents.length;
}

function vocabComplexity(text) {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  if (!words.length) return 0;
  return new Set(words).size / words.length;
}

export class PersonaService {
  constructor({ personaRepository }) {
    this.personaRepo = personaRepository;
  }

  async recordWritingSample(text, userId) {
    if (!text?.trim()) return;
    const sentLen = avgSentenceLength(text);
    const vocab = vocabComplexity(text);
    await Promise.all([
      this.personaRepo.upsertMetric({
        userId,
        metricName: "avg_sentence_length",
        metricValue: sentLen,
      }),
      this.personaRepo.upsertMetric({
        userId,
        metricName: "vocab_complexity",
        metricValue: vocab,
      }),
    ]);
  }

  async getPersonaSummary(userId) {
    const rows = await this.personaRepo.getMetricsByUserId(userId);
    const metrics = {};
    for (const row of rows) {
      metrics[row.metric_name] = parseFloat(row.metric_value);
    }
    return metrics;
  }
}
