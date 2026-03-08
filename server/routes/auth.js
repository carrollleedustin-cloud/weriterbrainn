import { Router } from "express";
import { randomUUID } from "crypto";
import { query } from "../db.js";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
} from "../auth.js";

const router = Router();

router.get("/me", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const r = await query(
    "SELECT id, email, display_name FROM users WHERE id = $1 AND is_active = true",
    [req.userId]
  );
  if (!r.rows[0]) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const u = r.rows[0];
  res.json({ id: u.id, email: u.email, display_name: u.display_name });
});

router.post("/register", async (req, res) => {
  const { email, password, display_name } = req.body || {};
  if (!email || !password) {
    return res.status(422).json({ detail: "Email and password required" });
  }
  if (password.length < 8) {
    return res.status(422).json({ detail: "Password must be at least 8 characters" });
  }
  const emailLower = String(email).toLowerCase();
  const existing = await query("SELECT id FROM users WHERE email = $1", [emailLower]);
  if (existing.rows[0]) {
    return res.status(400).json({ detail: "Email already registered" });
  }
  const id = randomUUID();
  await query(
    `INSERT INTO users (id, email, hashed_password, display_name, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
    [id, emailLower, hashPassword(password), display_name || null]
  );
  const token = createAccessToken(id);
  res.json({ access_token: token, token_type: "bearer", user_id: id });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(422).json({ detail: "Email and password required" });
  }
  const r = await query(
    "SELECT id, hashed_password, is_active FROM users WHERE email = $1",
    [String(email).toLowerCase()]
  );
  const user = r.rows[0];
  if (!user || !user.hashed_password || !verifyPassword(password, user.hashed_password)) {
    return res.status(401).json({ detail: "Invalid email or password" });
  }
  if (!user.is_active) {
    return res.status(403).json({ detail: "Account disabled" });
  }
  const token = createAccessToken(user.id);
  res.json({ access_token: token, token_type: "bearer", user_id: user.id });
});

export default router;
