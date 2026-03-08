import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config.js";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../../lib/validate.js";

const router = Router();

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

function createAccessToken(userId) {
  return jwt.sign(
    { sub: userId },
    config.jwtSecret,
    { algorithm: config.jwtAlgorithm, expiresIn: config.jwtExpireMinutes * 60 }
  );
}

router.get("/me", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  const user = await container.userRepository.findPublicProfile(req.userId);
  if (!user) {
    return res.status(401).json({ detail: "Not authenticated" });
  }
  res.json({ id: user.id, email: user.email, display_name: user.display_name });
});

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password, display_name } = req.validated;
  const emailLower = email.toLowerCase();
  if (await container.userRepository.existsByEmail(emailLower)) {
    return res.status(400).json({ detail: "Email already registered" });
  }
  const user = await container.userRepository.create({
    email: emailLower,
    hashedPassword: hashPassword(password),
    displayName: display_name,
  });
  const token = createAccessToken(user.id);
  res.json({ access_token: token, token_type: "bearer", user_id: user.id });
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated;
  const user = await container.userRepository.findByEmail(email.toLowerCase());
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
