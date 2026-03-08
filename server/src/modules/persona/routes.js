import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import { recordPersonaSchema } from "../../lib/validate.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const profile = await container.personaService.getCognitiveProfile(req.userId);
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/record", validate(recordPersonaSchema), async (req, res) => {
  try {
    const { text } = req.validated;
    await container.personaService.recordWritingSample(text, req.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
