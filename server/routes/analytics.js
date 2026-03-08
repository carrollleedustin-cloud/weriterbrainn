import { Router } from "express";
import { randomUUID } from "crypto";
import { query } from "../db.js";

const ALLOWED_EVENTS = new Set([
  "response_accepted",
  "response_regenerated",
  "response_edited",
]);

const router = Router();

router.post("/events", async (req, res) => {
  try {
    const { event_type, payload } = req.body || {};
    if (!ALLOWED_EVENTS.has(event_type)) {
      return res.json({
        ok: false,
        error: `event_type must be one of: ${[...ALLOWED_EVENTS].join(", ")}`,
      });
    }
    await query(
      `INSERT INTO analytics_events (id, event_type, user_id, payload, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [randomUUID(), event_type, req.userId, payload ? JSON.stringify(payload) : null]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
