import { PersonaRepository } from "../repositories/PersonaRepository.js";
import { extractPersonaMetrics } from "../lib/personaMetrics.js";

/**
 * Build a User Cognitive Profile from raw metrics.
 * Structured for prompt adaptation.
 */
function buildCognitiveProfile(metrics) {
  const p = metrics || {};
  const sentLen = p.avg_sentence_length;
  const vocab = p.vocab_complexity;
  const tone = p.tone_score ?? 0.5;
  const sentiment = p.sentiment_avg ?? 0;
  const questionRatio = p.question_ratio ?? 0;
  const avgMsgLen = p.avg_message_length;
  const exclRatio = p.exclamation_ratio ?? 0;

  const toneLabel = tone < 0.4 ? "formal" : tone > 0.65 ? "casual" : "neutral";
  const lengthPref =
    avgMsgLen != null
      ? avgMsgLen < 20
        ? "brief"
        : avgMsgLen > 80
          ? "detailed"
          : "moderate"
      : null;
  const asksQuestions = questionRatio > 0.2;
  const expressive = exclRatio > 0.15;

  return {
    tone: toneLabel,
    tone_score: tone,
    sentence_length_avg: sentLen != null ? Math.round(sentLen * 10) / 10 : null,
    vocab_diversity: vocab != null ? Math.round(vocab * 100) / 100 : null,
    response_length_preference: lengthPref,
    asks_questions_often: asksQuestions,
    expressive_punctuation: expressive,
    sentiment_tendency: sentiment < -0.1 ? "cautious" : sentiment > 0.1 ? "positive" : "neutral",
  };
}

export class PersonaService {
  constructor({ personaRepository }) {
    this.personaRepo = personaRepository;
  }

  async recordWritingSample(text, userId) {
    if (!text?.trim() || !userId) return;
    const metrics = extractPersonaMetrics(text);
    await Promise.all(
      Object.entries(metrics).map(([name, value]) =>
        this.personaRepo.upsertMetric({
          userId,
          metricName: name,
          metricValue: value,
        })
      )
    );
    await this.refreshCognitiveProfile(userId);
  }

  async refreshCognitiveProfile(userId) {
    if (!userId) return;
    const rows = await this.personaRepo.getMetricsByUserId(userId);
    const metrics = {};
    for (const r of rows) {
      metrics[r.metric_name] = parseFloat(r.metric_value);
    }
    const profile = buildCognitiveProfile(metrics);
    await this.personaRepo.upsertCognitiveProfile(userId, profile);
  }

  async getPersonaSummary(userId) {
    const rows = await this.personaRepo.getMetricsByUserId(userId);
    const metrics = {};
    for (const row of rows) {
      metrics[row.metric_name] = parseFloat(row.metric_value);
    }
    return metrics;
  }

  async getCognitiveProfile(userId) {
    const row = await this.personaRepo.getCognitiveProfile(userId);
    if (row?.profile) return row.profile;
    const metrics = await this.getPersonaSummary(userId);
    return buildCognitiveProfile(metrics);
  }
}
