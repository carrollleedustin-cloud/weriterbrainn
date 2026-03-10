"use client";

import Link from "next/link";
import { useMemo } from "react";

type Character = { id: string; name: string };

export function NarrativeLens({
  text,
  characters,
  className = "",
}: {
  text: string;
  characters: Character[];
  className?: string;
}) {
  const { parts, hasDialogue } = useMemo(() => {
    if (!text.trim()) return { parts: [{ type: "text" as const, value: text }], hasDialogue: /"[^"]+"/.test(text) };
    type Match = { start: number; end: number; value: string; id: string };
    const matches: Match[] = [];
    for (const c of characters) {
      const regex = new RegExp(c.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, value: m[0], id: c.id });
      }
    }
    matches.sort((a, b) => a.start - b.start);
    const merged: Match[] = [];
    for (const m of matches) {
      if (merged.length && m.start < merged[merged.length - 1].end) continue;
      merged.push(m);
    }
    type Part = { type: "text" | "character"; value: string; id?: string };
    const parts: Part[] = [];
    let last = 0;
    for (const m of merged) {
      if (m.start > last) parts.push({ type: "text", value: text.slice(last, m.start) });
      parts.push({ type: "character", value: m.value, id: m.id });
      last = m.end;
    }
    if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
    if (parts.length === 0) parts.push({ type: "text", value: text });
    return { parts, hasDialogue: /"[^"]+"|'[^']+'/.test(text) };
  }, [text, characters]);

  if (!text.trim()) return null;

  return (
    <div className={`relative ${className}`}>
      {hasDialogue && (
        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-[rgba(139,92,246,0.5)] to-transparent animate-nio-pulse" title="Dialogue resonance" />
      )}
      <div className="whitespace-pre-wrap break-words pl-3 text-[var(--fg-secondary)]">
        {parts.map((p, i) =>
          p.type === "character" && p.id ? (
            <Link
              key={i}
              href={`/mindspace/${p.id}`}
              className="rounded px-0.5 font-medium text-[rgba(192,132,252,0.95)] shadow-[0_0_12px_rgba(139,92,246,0.3)] transition hover:text-white hover:shadow-[0_0_16px_rgba(192,132,252,0.5)]"
            >
              {p.value}
            </Link>
          ) : (
            <span key={i}>{p.value}</span>
          )
        )}
      </div>
    </div>
  );
}
