"use client";

import { useState, useRef, useEffect } from "react";
import { chat, chatJson, recordAnalytics } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [lastAssistantIndex, setLastAssistantIndex] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async (stream = true) => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      if (stream) {
        setStreamingContent("");
        const res = await chat(text, conversationId ?? undefined, true);
        if (!res.ok) throw new Error(await res.text());
        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId) setConversationId(newConvId);

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamingContent(full);
        }
        setMessages((m) => [...m, { role: "assistant", content: full }]);
        setLastAssistantIndex(messages.length + 1);
        setStreamingContent("");
      } else {
        const data = await chatJson(text, conversationId ?? undefined);
        setConversationId(data.conversation_id);
        setMessages((m) => [...m, { role: "assistant", content: data.response }]);
        setLastAssistantIndex(messages.length + 1);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || loading) return;
    try {
      await recordAnalytics("response_regenerated");
    } catch {
      /* ignore */
    }
    setMessages((m) => m.slice(0, -1)); // remove last assistant
    setLoading(true);
    setError(null);
    try {
      const data = await chatJson(lastUser.content, conversationId ?? undefined);
      setMessages((m) => [...m, { role: "assistant", content: data.response }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      await recordAnalytics("response_accepted");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <h1 className="mb-4 text-2xl font-semibold text-zinc-50">AI Chat</h1>

      <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        {messages.length === 0 && !loading && (
          <p className="text-zinc-500">Send a message to start. Your brain remembers context from memories, conversations, and the knowledge graph.</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-4 ${msg.role === "user" ? "ml-8 text-right" : "mr-8"}`}
          >
            <span className="text-xs text-zinc-500">{msg.role}</span>
            <div
              className={`mt-1 rounded-lg px-3 py-2 ${
                msg.role === "user"
                  ? "ml-auto inline-block max-w-[80%] bg-zinc-700"
                  : "inline-block max-w-[80%] bg-zinc-800"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && i === messages.length - 1 && !streamingContent && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleRegenerate}
                  className="rounded bg-zinc-700 px-2 py-1 text-sm hover:bg-zinc-600"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleAccept}
                  className="rounded bg-zinc-700 px-2 py-1 text-sm hover:bg-zinc-600"
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        ))}
        {streamingContent && (
          <div className="mb-4 mr-8">
            <span className="text-xs text-zinc-500">assistant</span>
            <div className="mt-1 inline-block max-w-[80%] rounded-lg bg-zinc-800 px-3 py-2">
              {streamingContent}
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(true);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your brain..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-700 px-4 py-2 font-medium hover:bg-zinc-600 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}
