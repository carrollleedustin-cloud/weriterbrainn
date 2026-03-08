-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Ensure tsvector column for FTS on Memory
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "content_tsv" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("content", ''))) STORED;

-- Add embedding column using vector type (1536 dims for OpenAI ada-002; adjust as needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Memory' AND column_name = 'embedding_vec'
  ) THEN
    ALTER TABLE "Memory" ADD COLUMN "embedding_vec" vector(1536);
  END IF;
END $$;

-- GIN index for FTS
CREATE INDEX IF NOT EXISTS memory_content_tsv_gin ON "Memory" USING GIN ("content_tsv");

-- HNSW index for vector search (requires pgvector >= 0.5.0)
CREATE INDEX IF NOT EXISTS memory_embedding_hnsw ON "Memory" USING hnsw ("embedding_vec");
