import { Router } from "express";
import { container } from "../../container.js";
import { validate } from "../../middleware/validate.js";
import { chatSchema } from "../../lib/validate.js";

const router = Router();

router.post("/", validate(chatSchema), async (req, res) => {
  try {
    const { message, conversation_id, stream } = req.validated;
    const msg = message.trim();

    const convId = await container.conversationRepository.getOrCreate(
      conversation_id,
      req.userId
    );

    if (stream) {
      const { stream: tokenStream, citations } = await container.chatService.chatStream(
        msg,
        req.userId,
        convId
      );
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Conversation-Id", convId);
      if (citations?.length) {
        res.setHeader("X-Citations", JSON.stringify(citations));
      }
      res.flushHeaders();
      let full = "";
      for await (const token of tokenStream()) {
        full += token;
        res.write(token);
      }
      res.end();
      container.conversationRepository.addMessage(convId, "user", msg).catch(() => {});
      container.conversationRepository.addMessage(convId, "assistant", full).catch(() => {});
      container.personaService.recordWritingSample(msg, req.userId).catch(() => {});
      return;
    }

    const { response, citations } = await container.chatService.chatWithContext(
      msg,
      req.userId,
      convId
    );
    await container.conversationRepository.addMessage(convId, "user", msg);
    await container.conversationRepository.addMessage(convId, "assistant", response);

    container.memoryService.storeMemory(msg, "conversation", null, req.userId).catch(() => {});
    container.personaService.recordWritingSample(msg, req.userId).catch(() => {});

    res.json({ response, conversation_id: convId, citations: citations || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: "Internal server error" });
  }
});

export default router;
