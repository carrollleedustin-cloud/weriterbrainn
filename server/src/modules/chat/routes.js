import { Router } from "express";
import { container } from "../../container.js";

const router = Router();

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

    const convId = await container.conversationRepository.getOrCreate(
      conversation_id,
      req.userId
    );

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Conversation-Id", convId);
      res.flushHeaders();
      let full = "";
      for await (const token of container.chatService.chatStream(
        msg,
        req.userId,
        convId
      )) {
        full += token;
        res.write(token);
      }
      res.end();
      container.conversationRepository.addMessage(convId, "user", msg).catch(() => {});
      container.conversationRepository.addMessage(convId, "assistant", full).catch(() => {});
      return;
    }

    const response = await container.chatService.chatWithContext(
      msg,
      req.userId,
      convId
    );
    await container.conversationRepository.addMessage(convId, "user", msg);
    await container.conversationRepository.addMessage(convId, "assistant", response);

    container.memoryService.storeMemory(msg, "conversation", null, req.userId).catch(() => {});

    res.json({ response, conversation_id: convId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
