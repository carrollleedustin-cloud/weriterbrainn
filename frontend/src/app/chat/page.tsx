"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chat, chatJson, recordAnalytics, type Citation } from "@/lib/api";
import { useChatShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Message = { role: "user" | "assistant"; content: string; citations?: Citation[] };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useChatShortcuts({
    onSend: () => sendMessage(true),
    onClear: () => setInput(""),
    disabled: loading,
  });

  useEffect(() => {
    scrollToEnd();
  }, [messages, streamingContent, scrollToEnd]);

  const sendMessage = useCallback(
    async (stream = true) => {
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
          let streamCitations: Citation[] = [];
          try {
            const cit = res.headers.get("X-Citations");
            if (cit) streamCitations = JSON.parse(cit) as Citation[];
          } catch {
            /* ignore */
          }

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
          setMessages((m) => [...m, { role: "assistant", content: full, citations: streamCitations }]);
          setStreamingContent("");
        } else {
          const data = await chatJson(text, conversationId ?? undefined);
          setConversationId(data.conversation_id);
          setMessages((m) => [...m, { role: "assistant", content: data.response, citations: data.citations }]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, loading, conversationId]
  );

  const handleRegenerate = async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || loading) return;
    try {
      await recordAnalytics("response_regenerated");
    } catch {
      /* ignore */
    }
    setMessages((m) => m.slice(0, -1));
    setLoading(true);
    setError(null);
    try {
      const data = await chatJson(lastUser.content, conversationId ?? undefined);
      setMessages((m) => [...m, { role: "assistant", content: data.response, citations: data.citations }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
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
    <div className="flex h-[calc(100vh-12rem)] flex-col animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">
            AI Chat
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">Streaming cognition with memory fusion.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          Synapse Live
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(180deg,rgba(20,16,32,0.9),rgba(10,8,18,0.95))] p-4 shadow-[var(--shadow-md)]">
        {messages.length === 0 && !loading && (
          <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.08)] p-4 text-[var(--fg-secondary)]">
            Send a message to start. Your brain remembers context from memories, conversations,
            and the knowledge graph.
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            index={i}
            isLast={i === messages.length - 1}
            isStreaming={false}
            citations={msg.citations}
            onRegenerate={handleRegenerate}
            onAccept={handleAccept}
          />
        ))}
        {streamingContent && (
          <ChatMessage
            message={{ role: "assistant", content: streamingContent }}
            index={messages.length}
            isLast
            isStreaming
          />
        )}
        {error && (
          <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="mt-4 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(true);
        }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-overlay)]/80 px-3 py-2 shadow-[var(--shadow-sm)]">
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">You</span>
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message your brain..."
            disabled={loading}
            autoFocus
            aria-label="Chat message input"
            className="border-0 bg-transparent px-0 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus-visible:outline-none"
          />
        </div>
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? "..." : "Send"}
        </Button>
      </form>
    </div>
  );
}
