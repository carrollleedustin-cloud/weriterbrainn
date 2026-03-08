import OpenAI from "openai";
import { config } from "../../config.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

export class EmbeddingService {
  async getEmbeddings(texts) {
    if (!texts?.length) return [];
    if (!config.openaiApiKey) throw new Error("OPENAI_API_KEY not configured");
    const results = [];
    const batchSize = 100;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize).map((t) => (t?.trim() || " "));
      const resp = await getClient().embeddings.create({
        model: config.openaiEmbeddingModel,
        input: batch,
      });
      for (const item of resp.data.sort((a, b) => a.index - b.index)) {
        results.push(item.embedding);
      }
    }
    return results;
  }

  async embedText(text) {
    const emb = await this.getEmbeddings([text]);
    return emb[0] || [];
  }
}
