import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import {
  createMemorySchema,
  searchMemoriesSchema,
  consolidateMemoriesSchema,
} from "../../lib/validate.js";
import { runConsolidation } from "../../workers/ConsolidationWorker.js";

const router = Router();

router.post("/", validate(createMemorySchema), async (req, res) => {
  try {
    const { content, memory_type, title } = req.validated;
    const memory = await container.memoryService.storeMemory(
      content,
      memory_type,
      title ?? null,
      req.userId
    );
    res.json({
      id: memory.id,
      memory_type: (memory.memory_type || "").toLowerCase(),
      content: memory.content,
      title: memory.title,
      created_at: memory.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/search", validate(searchMemoriesSchema, "query"), async (req, res) => {
  try {
    const { q, limit, memory_type, tier } = req.validated;
    if (!q?.trim()) return res.json([]);
    const filters = {};
    if (memory_type) filters.memory_type = memory_type;
    if (tier) filters.tier = tier;
    const results = await container.memoryService.searchMemories(q, limit, req.userId, filters);
    const formatted = results.map((row) => ({
      memory: {
        id: row.id,
        memory_type: (row.memory_type || "").toLowerCase(),
        content: row.content,
        title: row.title,
        created_at: row.created_at,
      },
      chunk_text: row.chunk_text,
      score: parseFloat(row.score),
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/consolidate", validate(consolidateMemoriesSchema), async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required" });
    }
    const { older_than_days, batch_limit } = req.validated;
    const result = await runConsolidation(req.userId, {
      olderThanDays: older_than_days,
      batchLimit: batch_limit,
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
