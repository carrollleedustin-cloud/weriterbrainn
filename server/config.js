export const config = {
  env: process.env.NODE_ENV || "development",
  debug: process.env.DEBUG === "true",
  projectName: process.env.PROJECT_NAME || "WeriterBrainn",
  apiV1Prefix: "/api/v1",
  apiKey: process.env.API_KEY || null,
  corsOrigins: process.env.CORS_ORIGINS || "*",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtAlgorithm: "HS256",
  jwtExpireMinutes: parseInt(process.env.JWT_EXPIRE_MINUTES || "10080", 10),
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/weriterbrainn",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  // text-embedding-3-small = 1536, text-embedding-3-large = 3072 (requires migration)
  embeddingDim: parseInt(process.env.EMBEDDING_DIM || "1536", 10),
  redisUrl: process.env.REDIS_URL || null,
  useEmbeddingQueue: process.env.USE_EMBEDDING_QUEUE === "true",
  // RAG options
  queryRewrite: process.env.QUERY_REWRITE !== "false",
  rerank: process.env.RERANK !== "false",
  maxContextTokens: parseInt(process.env.MAX_CONTEXT_TOKENS || "3500", 10),
};
