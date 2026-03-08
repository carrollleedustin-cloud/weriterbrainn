import { Router } from "express";
import { getPersonaSummary, recordWritingSample } from "../services/persona.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const metrics = await getPersonaSummary(req.userId);
    res.json(metrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/record", async (req, res) => {
  try {
    const text = req.body?.text;
    if (text) await recordWritingSample(text, req.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
