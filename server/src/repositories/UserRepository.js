import { randomUUID } from "crypto";
import { query } from "../lib/db.js";

export class UserRepository {
  async findById(id) {
    const r = await query(
      "SELECT id, email, display_name, hashed_password, is_active FROM users WHERE id = $1",
      [id]
    );
    return r.rows[0] || null;
  }

  async findByEmail(email) {
    const r = await query("SELECT id, email, display_name, hashed_password, is_active FROM users WHERE email = $1", [
      String(email).toLowerCase(),
    ]);
    return r.rows[0] || null;
  }

  async findPublicProfile(id) {
    const r = await query(
      "SELECT id, email, display_name FROM users WHERE id = $1 AND is_active = true",
      [id]
    );
    return r.rows[0] || null;
  }

  async create({ email, hashedPassword, displayName }) {
    const id = randomUUID();
    await query(
      `INSERT INTO users (id, email, hashed_password, display_name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
      [id, String(email).toLowerCase(), hashedPassword, displayName || null]
    );
    return { id, email: String(email).toLowerCase(), display_name: displayName };
  }

  async existsByEmail(email) {
    const r = await query("SELECT 1 FROM users WHERE email = $1", [String(email).toLowerCase()]);
    return r.rows.length > 0;
  }
}
