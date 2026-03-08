import { Router } from "express";
import { query } from "../db.js";
import { config } from "../config.js";
import { getRedis, isRedisAvailable } from "../src/lib/redis.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: config.projectName,
    environment: config.env,
    redis: isRedisAvailable() ? "configured" : "disabled",
  });
});

router.get("/ready", async (req, res) => {
  const checks = {};
  try {
    await query("SELECT 1");
    checks.database = "ok";
  } catch (err) {
    checks.database = String(err?.message || err);
  }

  if (isRedisAvailable()) {
    try {
      const r = getRedis();
      await r.ping();
      checks.redis = "ok";
    } catch (err) {
      checks.redis = String(err?.message || err);
    }
  }

  const hasError = checks.database !== "ok";
  if (hasError) {
    return res.status(503).json({
      status: "error",
      service: config.projectName,
      checks,
    });
  }
  res.json({
    status: "ok",
    service: config.projectName,
    checks,
  });
});

export default router;
