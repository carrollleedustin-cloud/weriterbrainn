"use client";

import { Button } from "@/components/ui/Button";
import type { Citation } from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string };

type ChatMessageProps = {
  message: Message;
  index: number;
  isLast: boolean;
  isStreaming: boolean;
  citations?: Citation[];
  onRegenerate?: () => void;
  onAccept?: () => void;
};

/** Parse [1], [2] etc. and split content into segments with citation refs. */
function parseCitedContent(content: string): { text: string; ref?: number }[] {
  const re = /\[(\d+)\]/g;
  const parts: { text: string; ref?: number }[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIdx) {
      parts.push({ text: content.slice(lastIdx, m.index) });
    }
    parts.push({ text: m[0], ref: parseInt(m[1], 10) });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < content.length) {
    parts.push({ text: content.slice(lastIdx) });
  }
  return parts.length ? parts : [{ text: content }];
}

export function ChatMessage({
  message,
  index,
  isLast,
  isStreaming,
  citations = [],
  onRegenerate,
  onAccept,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const citedSegments = message.role === "assistant" && citations.length > 0
    ? parseCitedContent(message.content)
    : null;
  const citationMap = new Map(citations.map((c) => [c.index, c]));

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
          {citedSegments ? (
            <>
              {citedSegments.map((seg, i) =>
                seg.ref ? (
                  <sup
                    key={i}
                    className="inline-flex cursor-help items-center rounded px-0.5 align-baseline text-[10px] font-medium text-[var(--accent-strong)] underline decoration-dotted underline-offset-1"
                    title={citationMap.get(seg.ref)?.chunk_text}
                  >
                    [{seg.ref}]
                  </sup>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </>
          ) : (
            message.content
          )}
          {isStreaming && (
            <span className="ml-0.5 animate-pulse-soft">▌</span>
          )}
        </p>
      </div>
      {message.role === "assistant" && isLast && !isStreaming && citations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--fg-muted)]">
          <span className="uppercase tracking-[0.15em]">Sources</span>
          {citations.map((c) => (
            <span
              key={c.index}
              className="rounded border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-2 py-1"
              title={c.chunk_text}
            >
              [{c.index}] {c.chunk_text.slice(0, 60)}
              {c.chunk_text.length > 60 ? "…" : ""}
            </span>
          ))}
        </div>
      )}
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
