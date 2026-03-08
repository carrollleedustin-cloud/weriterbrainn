-- Add RAG strategy configuration fields
ALTER TABLE "UserRetrievalStrategy"
  ADD COLUMN IF NOT EXISTS "llmRewriteEnabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "maxVariants" integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "tokenBudget" integer NOT NULL DEFAULT 1024;
