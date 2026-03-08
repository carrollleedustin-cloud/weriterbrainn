import OpenAI from 'openai';
import { config } from '../../lib/config';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

export async function getTextEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  const v = res.data[0]?.embedding as number[] | undefined;
  if (!v) throw new Error('Failed to compute query embedding');
  return v;
}
