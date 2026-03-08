import { Router } from "express";
import { randomUUID } from "crypto";
import { query } from "../db.js";
import { chatWithContext, chatStream } from "../services/openai.js";
import { storeMemory } from "../services/memory.js";

const router = Router();

async function getOrCreateConversation(conversationId, userId) {
  if (conversationId) {
    const r = await query("SELECT id FROM conversations WHERE id = $1", [conversationId]);
    if (r.rows[0]) return r.rows[0].id;
  }
  const id = randomUUID();
  await query(
    `INSERT INTO conversations (id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())`,
    [id, userId]
  );
  return id;
}

async function addMessage(conversationId, role, content) {
  await query(
    `INSERT INTO conversation_messages (id, conversation_id, role, content, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [randomUUID(), conversationId, role, content]
  );
}

router.post("/", async (req, res) => {
  try {
    const { message, conversation_id, stream } = req.body || {};
    const msg = String(message || "").trim();
    if (!msg) {
      return res.status(422).json({ detail: "message required" });
    }
    if (msg.length > 32000) {
      return res.status(422).json({ detail: "message too long" });
    }
    const convId = await getOrCreateConversation(conversation_id, req.userId);

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Conversation-Id", convId);
      res.flushHeaders();
      let full = "";
      for await (const token of chatStream(msg, req.userId, convId)) {
        full += token;
        res.write(token);
      }
      res.end();
      addMessage(convId, "user", msg).catch(() => {});
      addMessage(convId, "assistant", full).catch(() => {});
      return;
    }

    const response = await chatWithContext(msg, req.userId, convId);
    await addMessage(convId, "user", msg);
    await addMessage(convId, "assistant", response);

    storeMemory(msg, "conversation", null, req.userId).catch(() => {});

    res.json({ response, conversation_id: convId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
