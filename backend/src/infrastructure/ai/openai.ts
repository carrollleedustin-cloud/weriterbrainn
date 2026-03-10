import OpenAI from 'openai';
import { config } from '../../lib/config';

let instance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!instance) {
    instance = new OpenAI({ apiKey: config.openaiApiKey });
  }
  return instance;
}

export const openai = getOpenAIClient();
