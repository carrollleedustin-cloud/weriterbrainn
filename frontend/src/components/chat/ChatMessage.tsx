"use client";

import { Button } from "@/components/ui/Button";

type Message = { role: "user" | "assistant"; content: string };

type ChatMessageProps = {
  message: Message;
  index: number;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
  onAccept?: () => void;
};

export function ChatMessage({
  message,
  index,
  isLast,
  isStreaming,
  onRegenerate,
  onAccept,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`animate-slide-up mb-5 ${
        isUser ? "ml-8 flex flex-col items-end" : "mr-8"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="mb-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">
        {message.role === "user" ? "You" : "Brain"}
      </span>
      <div
        className={`max-w-[85%] rounded-[var(--radius-lg)] px-4 py-3 shadow-[var(--shadow-sm)] ${
          isUser
            ? "border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)]"
            : "border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80"
        }`}
      >
        <p className="whitespace-pre-wrap text-[var(--fg-primary)] leading-relaxed">
          {message.content}
          {isStreaming && (
            <span className="ml-0.5 animate-pulse-soft">▌</span>
          )}
        </p>
      </div>
      {message.role === "assistant" && isLast && !isStreaming && (
        <div className="mt-2 flex gap-2">
          {onRegenerate && (
            <Button variant="ghost" onClick={onRegenerate}>
              Regenerate
            </Button>
          )}
          {onAccept && (
            <Button variant="ghost" onClick={onAccept}>
              Accept
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
