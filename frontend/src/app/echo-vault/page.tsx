"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { DimensionHeader } from "@/components/nio/DimensionHeader";

type EchoFilter = "all" | "betrayal" | "imagery" | "thematic" | "motif";

const FILTER_OPTIONS: { id: EchoFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "betrayal", label: "Betrayal" },
  { id: "imagery", label: "Imagery" },
  { id: "thematic", label: "Thematic" },
  { id: "motif", label: "Motif" },
];

function resonanceColor(v: number): string {
  if (v >= 0.9) return "rgba(192,132,252,0.9)";
  if (v >= 0.8) return "rgba(139,92,246,0.8)";
  if (v >= 0.7) return "rgba(99,102,241,0.7)";
  return "rgba(100,116,139,0.6)";
}

export default function EchoVaultPage() {
  useNarrativeInit();
  const echoes = useNarrativeStore((s) => s.echoes);
  const [filter, setFilter] = useState<EchoFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = useMemo(
    () => filter === "all" ? echoes : echoes.filter((e) => e.type === filter),
    [echoes, filter]
  );

  const avgResonance = useMemo(
    () => echoes.length ? echoes.reduce((s, e) => s + e.resonance, 0) / echoes.length : 0,
    [echoes]
  );

  const selected = echoes.find((e) => e.id === selectedId);

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<>Echo <span className="gradient-text">Vault</span></>}
        subtitle="Recurrence, motif, callback, symbolic architecture. Mirrored dialogue, thematic echoes."
        stats={
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Avg resonance</span>
            <span className="text-lg font-semibold text-[var(--fg-primary)]">{Math.round(avgResonance * 100)}%</span>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filter === f.id
                ? "border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.2)] text-[var(--fg-primary)]"
                : "border-[rgba(139,92,246,0.25)] text-[var(--fg-muted)] hover:border-[rgba(139,92,246,0.4)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-[10px] text-[var(--fg-muted)]">
          {filtered.length} echo{filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="cosmos-card rounded-xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Resonance field</h3>
          <div className="flex gap-3 text-[10px] text-[var(--fg-muted)]">
            <span>◆ 90%+</span>
            <span>◇ 80%+</span>
            <span>○ 70%+</span>
            <span>· &lt;70%</span>
          </div>
        </div>

        <div className="relative">
          <svg viewBox="0 0 600 120" className="w-full" style={{ minHeight: 120 }}>
            {filtered.map((e, i) => {
              const x1 = 20 + (i / Math.max(filtered.length - 1, 1)) * 260;
              const x2 = 320 + (i / Math.max(filtered.length - 1, 1)) * 260;
              const y = 20 + (i % 3) * 30;
              const col = resonanceColor(e.resonance);
              return (
                <g key={e.id}>
                  <motion.line
                    x1={x1} y1={y + 10} x2={x2} y2={y + 10}
                    stroke={col}
                    strokeWidth={e.resonance >= 0.9 ? 2 : 1}
                    strokeDasharray={e.resonance < 0.7 ? "4 4" : undefined}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                  <circle cx={x1} cy={y + 10} r={4} fill={col} />
                  <circle cx={x2} cy={y + 10} r={4} fill={col} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ delay: i * 0.04 }}
            role="button"
            tabIndex={0}
            aria-label={`Echo: ${e.source} to ${e.target}`}
            onClick={() => { setSelectedId(e.id); setPanelOpen(true); }}
            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelectedId(e.id); setPanelOpen(true); }}}
            className="cosmos-card flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-all hover:border-[rgba(139,92,246,0.5)] hover:shadow-[0_0_16px_rgba(139,92,246,0.1)]"
            >
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] uppercase"
                style={{
                  borderColor: resonanceColor(e.resonance),
                  color: resonanceColor(e.resonance),
                  background: resonanceColor(e.resonance).replace(/[\d.]+\)$/, "0.1)"),
                }}
              >
                {e.type}
              </span>
              <span className="text-sm text-[var(--fg-primary)]">{e.source}</span>
              <span className="text-[var(--fg-muted)]">↔</span>
              <span className="text-sm text-[var(--fg-secondary)]">{e.target}</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${e.resonance * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="h-full rounded-full"
                    style={{ background: resonanceColor(e.resonance) }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: resonanceColor(e.resonance) }}>
                  {Math.round(e.resonance * 100)}%
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <PhaseShiftPanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Echo Analysis">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.1)] px-2 py-0.5 text-xs uppercase text-[var(--fg-muted)]">{selected.type}</span>
              <span className="text-xs text-[var(--fg-muted)]">Resonance: {Math.round(selected.resonance * 100)}%</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Source</p>
                <p className="text-sm text-[var(--fg-primary)]">{selected.source}</p>
              </div>
              <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Target</p>
                <p className="text-sm text-[var(--fg-primary)]">{selected.target}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Symbolic assessment</p>
              <p className="text-sm text-[var(--fg-secondary)]">
                {selected.resonance >= 0.9
                  ? "Critical echo — deeply woven into narrative fabric. Removal would fracture thematic coherence."
                  : selected.resonance >= 0.8
                    ? "Strong echo. Reinforce before climax for maximum impact."
                    : selected.resonance >= 0.7
                      ? "Moderate echo. Consider deepening the connection between source and target."
                      : "Weak echo. Potential for motif decay — strengthen or prune."}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Recommended action</p>
              <p className="text-sm text-[var(--fg-secondary)]">
                {selected.resonance >= 0.85
                  ? "Preserve and amplify. Add one more callback before the resolution."
                  : "Consider adding a mirrored dialogue beat or imagery callback in a transitional scene."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[var(--fg-muted)]">Select an echo to analyze.</p>
        )}
      </PhaseShiftPanel>

      <Link href="/nexus" className="inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
        ← Origin Nexus
      </Link>
    </div>
  );
}
