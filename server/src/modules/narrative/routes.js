import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import {
  narrativeExtractSchema,
  narrativeCompileSchema,
  narrativeQuerySchema,
  oracleSimulateSchema,
  storyEchoSchema,
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
  res.set("Cache-Control", "private, max-age=2");
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
  res.set("Cache-Control", "private, max-age=2");
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
  res.set("Cache-Control", "private, max-age=2");
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
  res.set("Cache-Control", "private, max-age=2");
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

router.get("/knowledge/knowers/:factKey", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const factKey = decodeURIComponent(req.params.factKey);
    const rows = await container.knowledgeStateService.getKnowersOfFact(factKey, req.userId);
    res.json({ knowers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/knowledge/:characterId", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const rows = await container.knowledgeStateService.getKnowledgeForCharacter(req.params.characterId, req.userId);
    res.json({ knowledge: rows });
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

router.post("/oracle/simulate", validate(oracleSimulateSchema), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const { character, situation } = req.validated;
    const q = `What would ${character} do in this situation? Simulate their likely response based on their psychology, goals, relationships, and past behavior. Situation: ${situation}`;
    const result = await container.storyQAService.ask(q, req.userId);
    res.json({ ...result, character, situation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/echoes", validate(storyEchoSchema), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const { context } = req.validated;
    const q = `Analyze this story context and suggest powerful callbacks—earlier events, phrases, or motifs that could echo here for emotional resonance. Context: ${context.slice(0, 2000)}. Return JSON: {"echoes":[{"source":"earlier event/location","suggestion":"how to echo it here","emotional_impact":"..."}]}`;
    const result = await container.storyQAService.ask(q, req.userId);
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

router.get("/canon/facts", async (req, res) => {
  res.set("Cache-Control", "private, max-age=2");
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const canonState = req.query.state || null;
    const factType = req.query.type || null;
    const result = await container.canonLedgerService.getFacts(req.userId, {
      canonState,
      factType,
      limit: 200,
    });
    res.json({ facts: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/canon/facts/:factId", async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ detail: "Authentication required" });
    const result = await container.canonLedgerService.getFactById(req.params.factId, req.userId);
    if (!result) return res.status(404).json({ detail: "Fact not found" });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/edges", async (req, res) => {
  res.set("Cache-Control", "private, max-age=2");
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
