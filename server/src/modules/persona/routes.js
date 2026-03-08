import { Router } from "express";
import { container } from "../../container.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const metrics = await container.personaService.getPersonaSummary(req.userId);
    res.json(metrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/record", async (req, res) => {
  try {
    const text = req.body?.text;
    if (text) await container.personaService.recordWritingSample(text, req.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
