import { createHash } from "crypto";
import OpenAI from "openai";
import { config } from "../../config.js";
import { redisGet, redisSet, isRedisAvailable } from "../lib/redis.js";

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

function contentHash(text) {
  return createHash("sha256").update(text).digest("hex").slice(0, 32);
}

const EMBED_CACHE_TTL = 60 * 60 * 24 * 7;

export class EmbeddingService {
  async getEmbeddings(texts) {
    if (!texts?.length) return [];
    if (!config.openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    const useCache = isRedisAvailable();
    const results = [];
    const toFetch = [];

    for (let i = 0; i < texts.length; i++) {
      const t = (texts[i] || "").trim() || " ";
      if (useCache) {
        const key = `emb:${config.openaiEmbeddingModel}:${contentHash(t)}`;
        const cached = await redisGet(key);
        if (cached && Array.isArray(cached)) {
          results[i] = cached;
          continue;
        }
      }
      toFetch.push({ index: i, text: t });
    }

    if (toFetch.length > 0) {
      const batchSize = 100;
      for (let j = 0; j < toFetch.length; j += batchSize) {
        const batch = toFetch.slice(j, j + batchSize);
        const input = batch.map((b) => b.text);
        const resp = await getClient().embeddings.create({
          model: config.openaiEmbeddingModel,
          input,
        });
        for (const item of resp.data.sort((a, b) => a.index - b.index)) {
          const origIdx = batch[item.index]?.index ?? item.index;
          results[origIdx] = item.embedding;
          if (useCache && item.embedding) {
            const key = `emb:${config.openaiEmbeddingModel}:${contentHash(batch[item.index]?.text || "")}`;
            redisSet(key, item.embedding, EMBED_CACHE_TTL).catch(() => {});
          }
        }
      }
    }

    return texts.map((_, i) => results[i]);
  }

  async embedText(text) {
    const emb = await this.getEmbeddings([text]);
    return emb[0] || [];
  }
}
