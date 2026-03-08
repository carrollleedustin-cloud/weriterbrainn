import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "./config.js";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hashed) {
  return bcrypt.compareSync(plain, hashed);
}

export function createAccessToken(userId) {
  const exp = Math.floor(Date.now() / 1000) + config.jwtExpireMinutes * 60;
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    algorithm: config.jwtAlgorithm,
    expiresIn: config.jwtExpireMinutes * 60,
  });
}

export function decodeAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm],
    });
    return payload?.sub || null;
  } catch {
    return null;
  }
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    req.userId = null;
    return next();
  }
  const token = auth.slice(7);
  const sub = decodeAccessToken(token);
  req.userId = sub || null;
  next();
}
