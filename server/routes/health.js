import { Router } from "express";
import { query } from "../db.js";
import { config } from "../config.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: config.projectName,
    environment: config.env,
  });
});

router.get("/ready", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({
      status: "ok",
      service: config.projectName,
      checks: { database: "ok" },
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      service: config.projectName,
      detail: "database",
      message: String(err?.message || err),
    });
  }
});

export default router;
