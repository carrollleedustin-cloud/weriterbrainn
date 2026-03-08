import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import { analyticsEventSchema } from "../../lib/validate.js";

const router = Router();

router.post("/events", validate(analyticsEventSchema), async (req, res) => {
  try {
    const { event_type, payload } = req.validated;
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

router.get("/insights", async (req, res) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14));
    const rows = await container.analyticsRepository.getEventCountsByDay(req.userId, days);
    res.json({ event_counts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
