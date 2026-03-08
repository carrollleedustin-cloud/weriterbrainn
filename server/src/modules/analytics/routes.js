import { Router } from "express";
import { container } from "../../container.js";
import { ANALYTICS_EVENTS } from "../../domain/index.js";

const router = Router();
const ALLOWED_EVENTS = new Set(ANALYTICS_EVENTS);

router.post("/events", async (req, res) => {
  try {
    const { event_type, payload } = req.body || {};
    if (!ALLOWED_EVENTS.has(event_type)) {
      return res.json({
        ok: false,
        error: `event_type must be one of: ${[...ALLOWED_EVENTS].join(", ")}`,
      });
    }
    await container.analyticsRepository.recordEvent({
      eventType: event_type,
      userId: req.userId,
      payload,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
