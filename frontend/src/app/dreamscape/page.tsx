"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import {
  DREAMSCAPE_ARCHETYPES as ARCHETYPES,
  DREAMSCAPE_SYMBOLS as SYMBOLS,
  type Archetype,
} from "@/lib/demo-service";

export default function DreamscapePage() {
  useNarrativeInit();
  const characters = useNarrativeStore((s) => s.characters);
  const [text, setText] = useState("");
  const [activeArchetype, setActiveArchetype] = useState<Archetype | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [symbolOverlay, setSymbolOverlay] = useState(false);
  const [dreamFragments, setDreamFragments] = useState<string[]>([]);

  const detectedSymbols = useMemo(() => {
    const lower = text.toLowerCase();
    return SYMBOLS.filter((s) =>
      lower.includes(s.name.toLowerCase()) ||
      (s.name === "Water" && /\b(river|rain|ocean|sea|tears|drown|flood)\b/i.test(text)) ||
      (s.name === "Fire" && /\b(flame|burn|ash|ember|blaze|scorch)\b/i.test(text)) ||
      (s.name === "Mirror" && /\b(reflection|glass|gaze|vanity)\b/i.test(text)) ||
      (s.name === "Darkness" && /\b(shadow|night|void|abyss|black)\b/i.test(text)) ||
      (s.name === "World Tree" && /\b(root|branch|trunk|grow|seed)\b/i.test(text)) ||
      (s.name === "Spiral" && /\b(spiral|cycle|return|loop|orbit)\b/i.test(text)) ||
      (s.name === "Sacred Wound" && /\b(wound|scar|break|fracture|bleed)\b/i.test(text)) ||
      (s.name === "Threshold" && /\b(door|gate|passage|cross|enter)\b/i.test(text))
    );
  }, [text]);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const captureDreamFragment = useCallback(() => {
    if (text.trim().length > 0) {
      setDreamFragments((f) => [text.trim(), ...f].slice(0, 20));
      setText("");
    }
  }, [text]);

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<span className="gradient-text">Dreamscape</span>}
        subtitle="Dream-logic writing. Archetype consultation. Symbol garden. Shadow self."
        tier="Premium"
        stats={
          <>
            <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{wordCount} words</span>
            <span className="text-[10px] uppercase tracking-wider text-[rgba(192,132,252,0.8)]">{detectedSymbols.length} symbols active</span>
          </>
        }
      />

      <div className="cosmos-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="section-label text-xs font-medium uppercase tracking-wide">Surreal creation surface</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSymbolOverlay(!symbolOverlay)}
              className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider transition ${
                symbolOverlay
                  ? "border-[rgba(192,132,252,0.6)] bg-[rgba(192,132,252,0.15)] text-[var(--fg-primary)]"
                  : "border-[rgba(139,92,246,0.3)] text-[var(--fg-muted)] hover:border-[rgba(139,92,246,0.5)]"
              }`}
            >
              Symbols
            </button>
            <button
              type="button"
              onClick={captureDreamFragment}
              disabled={!text.trim()}
              className="rounded-full border border-[rgba(139,92,246,0.3)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] transition hover:border-[rgba(139,92,246,0.5)] hover:text-[var(--fg-primary)] disabled:opacity-30"
            >
              Capture fragment
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write in dream logic. Images over chronology. Symbol over sense. Let the unconscious lead..."
            className="h-56 w-full resize-none rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] p-4 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
          />
          <AnimatePresence>
            {symbolOverlay && detectedSymbols.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2 rounded-lg border border-[rgba(192,132,252,0.3)] bg-[rgba(10,7,16,0.95)] p-3 backdrop-blur-md"
              >
                {detectedSymbols.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 rounded-full border border-[rgba(192,132,252,0.3)] bg-[rgba(192,132,252,0.08)] px-2 py-0.5">
                    <span className="text-sm text-[rgba(192,132,252,0.9)]">{s.glyph}</span>
                    <span className="text-[10px] text-[rgba(192,132,252,0.8)]">{s.name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="cosmos-card rounded-xl p-6">
        <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Archetype consultation</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ARCHETYPES.map((a, i) => (
            <motion.button
              type="button"
              key={a.id}
              onClick={() => { setActiveArchetype(a); setPanelOpen(true); }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group relative overflow-hidden rounded-lg border border-[rgba(139,92,246,0.25)] bg-[rgba(19,16,28,0.6)] p-4 text-left transition-all hover:border-[rgba(139,92,246,0.5)]"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `radial-gradient(circle at 30% 30%, ${a.color.replace(/[\d.]+\)$/, "0.12)")}, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="text-xl" style={{ color: a.color }}>{a.glyph}</span>
                  <span className="text-sm font-medium text-[var(--fg-primary)]">{a.name}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--fg-muted)] line-clamp-2">{a.description}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="cosmos-card rounded-xl p-6">
        <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Symbol garden</h3>
        <div className="grid gap-2 sm:grid-cols-4">
          {SYMBOLS.map((s) => {
            const active = detectedSymbols.some((d) => d.id === s.id);
            return (
              <div
                key={s.id}
                className={`rounded-lg border p-3 transition ${
                  active
                    ? "border-[rgba(192,132,252,0.5)] bg-[rgba(192,132,252,0.1)] shadow-[0_0_12px_rgba(192,132,252,0.1)]"
                    : "border-[rgba(139,92,246,0.15)] bg-[rgba(19,16,28,0.4)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${active ? "text-[rgba(192,132,252,0.9)]" : "text-[var(--fg-muted)]"}`}>{s.glyph}</span>
                  <span className={`text-xs font-medium ${active ? "text-[var(--fg-primary)]" : "text-[var(--fg-muted)]"}`}>{s.name}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[rgba(192,132,252,0.8)] animate-nio-pulse" />}
                </div>
                <p className="mt-1 text-[10px] text-[var(--fg-muted)]">{s.meaning}</p>
              </div>
            );
          })}
        </div>
      </div>

      {dreamFragments.length > 0 && (
        <div className="cosmos-card rounded-xl p-6">
          <h3 className="section-label mb-3 text-xs font-medium uppercase tracking-wide">Dream fragments</h3>
          <div className="space-y-2">
            {dreamFragments.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 0.6 + (i === 0 ? 0.4 : 0), x: 0 }}
                className="rounded-lg border border-[rgba(139,92,246,0.15)] bg-[rgba(19,16,28,0.4)] px-3 py-2"
              >
                <p className="text-xs italic text-[var(--fg-secondary)]">&ldquo;{f}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <PhaseShiftPanel open={panelOpen} onClose={() => setPanelOpen(false)} title={activeArchetype?.name ?? "Archetype"}>
        {activeArchetype ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl" style={{ color: activeArchetype.color }}>{activeArchetype.glyph}</span>
              <div>
                <p className="text-sm font-medium text-[var(--fg-primary)]">{activeArchetype.name}</p>
                <p className="text-xs text-[var(--fg-muted)]">Jungian archetype</p>
              </div>
            </div>
            <p className="text-sm text-[var(--fg-secondary)]">{activeArchetype.description}</p>
            <div className="rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.05)] p-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Writing prompt</p>
              <p className="text-sm italic text-[var(--fg-primary)]">&ldquo;{activeArchetype.prompt}&rdquo;</p>
            </div>
            {characters.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Character resonance</p>
                <div className="flex flex-wrap gap-2">
                  {characters.slice(0, 4).map((c) => (
                    <span key={c.id} className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-2 py-0.5 text-xs text-[var(--fg-secondary)]">
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </PhaseShiftPanel>

      <Link href="/nexus" className="inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
        ← Origin Nexus
      </Link>
    </div>
  );
}
