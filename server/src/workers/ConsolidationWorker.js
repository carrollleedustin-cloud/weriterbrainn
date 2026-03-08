/**
 * Consolidation Worker — merges/ages older short-term memories.
 *
 * Pipeline:
 * 1. Find short_term memories older than N days
 * 2. (Stub) Log candidates; full impl would summarize via LLM and create consolidated memory
 * 3. (Stub) Promote eligible memories to long_term tier
 *
 * Invoke via: ConsolidationWorker.run(userId, options)
 * Or wire to a job queue (BullMQ) in Phase 6.
 */
import { MemoryRepository } from "../repositories/MemoryRepository.js";
import { logger } from "../lib/logger.js";
import { runWithContext } from "../lib/requestContext.js";

const DEFAULT_OPTIONS = {
  olderThanDays: 7,
  batchLimit: 20,
  promoteToLongTerm: true,
  /** When true, would call LLM to summarize; stub skips */
  summarizeWithLLM: false,
};

/**
 * Run consolidation for a user.
 * @param {string} userId
 * @param {Object} [options]
 * @param {number} [options.olderThanDays=7]
 * @param {number} [options.batchLimit=20]
 * @param {boolean} [options.promoteToLongTerm=true] - Promote old short_term to long_term
 * @param {boolean} [options.summarizeWithLLM=false] - Stub: not implemented
 * @returns {{ processed: number, promoted: number, skipped: number }}
 */
export async function runConsolidation(userId, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const memoryRepo = new MemoryRepository();
  const result = { processed: 0, promoted: 0, skipped: 0 };

  if (!userId) {
    logger.info("ConsolidationWorker: no userId, skipping");
    return result;
  }

  return runWithContext(userId, async () => {
    const candidates = await memoryRepo.findCandidatesForConsolidation({
      userId,
      olderThanDays: opts.olderThanDays,
      limit: opts.batchLimit,
    });

    if (!candidates.length) {
      logger.debug("ConsolidationWorker: no candidates", { userId });
      return result;
    }

    logger.info("ConsolidationWorker: found candidates", {
      userId,
      count: candidates.length,
      olderThanDays: opts.olderThanDays,
    });

    for (const mem of candidates) {
      result.processed++;
      if (opts.summarizeWithLLM) {
        result.skipped++;
        logger.debug("ConsolidationWorker: LLM summarization not implemented, skipping", {
          memoryId: mem.id,
        });
        continue;
      }
      if (opts.promoteToLongTerm) {
        await memoryRepo.updateMemory({
          memoryId: mem.id,
          tier: "long_term",
        });
        result.promoted++;
      }
    }

    return result;
  });
}
