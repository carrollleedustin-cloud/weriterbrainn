import { Router } from "express";
import { query } from "../db.js";
import {
  extractEntitiesAndRelations,
  addExtractionToGraph,
} from "../services/extraction.js";

const router = Router();

router.get("/nodes", async (req, res) => {
  try {
    const r = await query(
      `SELECT id, name, node_type, description FROM knowledge_graph_nodes
       WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       ORDER BY name`,
      [req.userId]
    );
    res.json(
      r.rows.map((n) => ({
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
    const r = await query(
      `SELECT e.id, e.source_id, e.target_id, e.relationship_type
       FROM knowledge_graph_edges e
       WHERE e.source_id IN (
         SELECT id FROM knowledge_graph_nodes
         WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       ) OR e.target_id IN (
         SELECT id FROM knowledge_graph_nodes
         WHERE ($1::uuid IS NULL AND user_id IS NULL) OR user_id = $1
       )`,
      [req.userId]
    );
    res.json(
      r.rows.map((e) => ({
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
    const { entities, relationships } = await extractEntitiesAndRelations(text);
    await addExtractionToGraph(entities, relationships, req.userId);
    res.json({ entities: entities.length, relationships: relationships.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
