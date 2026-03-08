import { Router } from "express";
import { container } from "../../container.js";

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

router.post("/extract", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.json({ entities: 0, relationships: 0 });
    }
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
