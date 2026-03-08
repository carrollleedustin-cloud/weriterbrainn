-- Add memory tier enum + column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MemoryTier') THEN
    CREATE TYPE "MemoryTier" AS ENUM ('SHORT_TERM', 'LONG_TERM');
  END IF;
END $$;

ALTER TABLE "Memory"
  ADD COLUMN IF NOT EXISTS "tier" "MemoryTier" NOT NULL DEFAULT 'SHORT_TERM';

-- Optional index for tier-based retrieval
CREATE INDEX IF NOT EXISTS memory_tier_idx ON "Memory" ("userId", "tier");
