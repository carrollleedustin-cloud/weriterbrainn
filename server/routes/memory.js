import { Router } from "express";
import { storeMemory, searchMemories } from "../services/memory.js";

const VALID_TYPES = ["conversation", "note", "idea", "document", "project", "belief", "goal"];
const router = Router();

router.post("/", async (req, res) => {
  try {
    const { content, memory_type = "note", title } = req.body || {};
    if (!content || typeof content !== "string") {
      return res.status(422).json({ detail: "content required" });
    }
    if (content.length > 100_000) {
      return res.status(422).json({ detail: "content too long" });
    }
    const mt = String(memory_type || "note").toLowerCase();
    if (!VALID_TYPES.includes(mt)) {
      return res.status(400).json({
        detail: `Invalid memory_type. Must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }
    const memory = await storeMemory(content, mt, title || null, req.userId);
    res.json({
      id: memory.id,
      memory_type: memory.memory_type,
      content: memory.content,
      title: memory.title,
      created_at: memory.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "10", 10) || 10, 50);
    if (!q) return res.json([]);
    const results = await searchMemories(q, limit, req.userId);
    res.json(
      results.map((row) => ({
        memory: {
          id: row.id,
          memory_type: row.memory_type,
          content: row.content,
          title: row.title,
          created_at: row.created_at,
        },
        chunk_text: row.chunk_text,
        score: parseFloat(row.score),
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
