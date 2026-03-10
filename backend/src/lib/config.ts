import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string, def?: string) {
  const v = process.env[key] ?? def;
  if (v === undefined) throw new Error(`Missing required env var ${key}`);
  return v;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 8787),
  logLevel: process.env.LOG_LEVEL ?? 'info',

  databaseUrl: requireEnv('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/brain'),
  redisUrl: requireEnv('REDIS_URL', 'redis://127.0.0.1:6379'),

  openaiApiKey: requireEnv('OPENAI_API_KEY', ''),
  // Optional API key for simple auth; when empty, auth check is disabled
  apiKey: process.env.API_KEY ?? '',
  // Optional JWT secret for Bearer auth; when empty, JWT auth is disabled
  jwtSecret: process.env.JWT_SECRET ?? '',
};
