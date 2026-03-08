import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import { extractSchema, graphSearchSchema } from "../../lib/validate.js";

const router = Router();

router.get("/nodes", async (req, res) => {
  try {
    const rows = await container.knowledgeGraphRepository.findNodesByUserId(req.userId);
    res.json(
      rows.map((n) => ({
        id: n.id,
        name: n.name,
        node_type: n.node_type,
        description: n.description,
        metadata: n.metadata || null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/edges", async (req, res) => {
  try {
    const rows = await container.knowledgeGraphRepository.findEdgesByUserId(req.userId);
    res.json(
      rows.map((e) => ({
        id: e.id,
        source_id: e.source_id,
        target_id: e.target_id,
        relationship_type: e.relationship_type,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.get("/search", validate(graphSearchSchema, "query"), async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ detail: "Authentication required" });
    }
    const { q, limit } = req.validated;
    const rows = await container.ragService.searchEntities(q, req.userId, limit);
    res.json(
      rows.map((n) => ({
        id: n.id,
        name: n.name,
        node_type: n.node_type,
        description: n.description,
        metadata: n.metadata || null,
        score: n.score != null ? parseFloat(n.score) : null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

router.post("/extract", validate(extractSchema), async (req, res) => {
  try {
    const { text } = req.validated;
    const { entities, relationships } = await container.extractionService.extractEntitiesAndRelations(
      text
    );
    await container.extractionService.addToGraph(entities, relationships, req.userId);
    res.json({ entities: entities.length, relationships: relationships.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
