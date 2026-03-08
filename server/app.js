import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { authMiddleware } from "./auth.js";
import { runWithContext } from "./src/lib/requestContext.js";
import { rateLimitMiddleware } from "./src/lib/rateLimit.js";
import sql from "../db.js";

import healthRouter from "./routes/health.js";
import authRouter from "./src/modules/auth/routes.js";
import memoryRouter from "./src/modules/memory/routes.js";
import chatRouter from "./src/modules/chat/routes.js";
import graphRouter from "./src/modules/knowledge-graph/routes.js";
import personaRouter from "./src/modules/persona/routes.js";
import analyticsRouter from "./src/modules/analytics/routes.js";

const app = express();
app.locals.sql = sql;

app.use(express.json({ limit: "1mb" }));
const corsOrigins = config.corsOrigins === "*" ? "*" : config.corsOrigins.split(",").map((o) => o.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));

// Rate limit API (skip for health checks)
app.use((req, res, next) => {
  const p = req.path || "";
  if (p.startsWith("/api/v1/health") || p === "/") return next();
  return rateLimitMiddleware({ max: 100, windowMs: 60000 })(req, res, next);
});

app.use(authMiddleware);

app.use((req, res, next) => {
  runWithContext(req.userId, () => next());
});

app.use(`${config.apiV1Prefix}/health`, healthRouter);
app.use(`${config.apiV1Prefix}/auth`, authRouter);
app.use(`${config.apiV1Prefix}/memories`, memoryRouter);
app.use(`${config.apiV1Prefix}/chat`, chatRouter);
app.use(`${config.apiV1Prefix}/graph`, graphRouter);
app.use(`${config.apiV1Prefix}/persona`, personaRouter);
app.use(`${config.apiV1Prefix}/analytics`, analyticsRouter);

app.get("/", (req, res) => {
  res.json({ message: `${config.projectName} backend is running` });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ detail: "Internal server error" });
});

export default app;
