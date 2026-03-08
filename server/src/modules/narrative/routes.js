import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import {
  narrativeExtractSchema,
  narrativeCompileSchema,
  narrativeQuerySchema,
} from "../../lib/validate.js";

const router = Router();

router.post("/extract", validate(narrativeExtractSchema), async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required for narrative extraction" });
    }
    const { text } = req.validated;
    const result = await container.narrativeExtractionService.extractAndIngest(text, req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/project", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required" });
    }
    const project = await container.narrativeRepository.getOrCreateDefaultProject(req.userId);
    res.json({
      id: project.id,
      title: project.title,
      branch: project.branch,
      created_at: project.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/objects", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required" });
    }
    const project = await container.narrativeRepository.getOrCreateDefaultProject(req.userId);
    const objectType = req.query.type || null;
    const objects = await container.narrativeRepository.findObjectsByProject(project.id, objectType);
    res.json(
      objects.map((o) => ({
        id: o.id,
        object_type: (o.object_type || "").toLowerCase(),
        name: o.name,
        summary: o.summary,
        metadata: o.metadata,
        canon_state: (o.canon_state || "").toLowerCase(),
        created_at: o.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/compile", validate(narrativeCompileSchema), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const { text } = req.validated;
    const result = await container.storyCompilerService.compile(text, req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/timeline", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const result = await container.timelineService.getTimeline(req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/plot-threads", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const result = await container.plotThreadService.getPlotThreads(req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/strategy", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const focus = req.query.focus || null;
    const result = await container.storyStrategistService.getStrategy(req.userId, focus);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/characters", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const result = await container.characterService.listCharacters(req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/characters/:objectId", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const result = await container.characterService.getCharacterDetails(req.params.objectId, req.userId);
    if (!result) return res.status(404).json({ detail: "Character not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/preview", validate(narrativeCompileSchema), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const { text } = req.validated;
    const context = req.body.context || null;
    const result = await container.consequencePreviewService.preview(text, context, req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/ask", validate(narrativeQuerySchema, "query"), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const { q } = req.validated;
    const result = await container.storyQAService.ask(q, req.userId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/edges", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required" });
    }
    const project = await container.narrativeRepository.getOrCreateDefaultProject(req.userId);
    const edges = await container.narrativeRepository.findEdgesByProject(project.id);
    res.json(
      edges.map((e) => ({
        id: e.id,
        source_id: e.source_id,
        target_id: e.target_id,
        edge_type: e.edge_type,
        metadata: e.metadata,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
