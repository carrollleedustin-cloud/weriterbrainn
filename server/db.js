import pg from "pg";
import pgvector from "pgvector/pg";
import { config } from "./config.js";
import { getRequestUserId } from "./src/lib/requestContext.js";

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      idleTimeoutMillis: 30000,
    });
    pool.on("connect", (client) => {
      pgvector.registerTypes(client);
    });
  }
  return pool;
}

/**
 * Run a query with RLS context. Sets app.user_id when userId is in request context.
 */
export async function query(text, params) {
  const p = getPool();
  const userId = getRequestUserId();

  const client = await p.connect();
  try {
    if (userId) {
      await client.query("SET LOCAL app.user_id = $1", [userId]);
    }
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
