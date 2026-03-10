"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import {
  SIMULATION_OPERATIONS as OPERATIONS,
  getSimulationResult as simulateResult,
  type SimResult,
} from "@/lib/demo-service";

export default function SimulationPage() {
  useNarrativeInit();
  const universe = useNarrativeStore((s) => s.universe);
  const threads = useNarrativeStore((s) => s.threads);
  const health = useNarrativeStore((s) => s.health);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [history, setHistory] = useState<SimResult[]>([]);

  const runSimulation = (opId: string) => {
    setActiveOp(opId);
    const res = simulateResult(opId);
    setTimeout(() => {
      setResult(res);
      setHistory((h) => [res, ...h].slice(0, 10));
      setActiveOp(null);
    }, 800);
  };

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<>Simulation <span className="gradient-text">Chamber</span></>}
        subtitle="Narrative collider. Run what-if operations. Watch consequences propagate."
        stats={
          <>
            <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{threads.length} active threads</span>
            <span className="text-[10px] uppercase tracking-wider text-rose-400/80">{Math.round(health.tensionLoad * 100)}% tension</span>
          </>
        }
      />

      <div className="cosmos-card rounded-xl p-6">
        <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">
          Operations — select a what-if
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => runSimulation(op.id)}
              disabled={activeOp !== null}
              className={`group rounded-lg border border-[rgba(139,92,246,0.25)] bg-[rgba(19,16,28,0.6)] px-3 py-3 text-left transition-all hover:border-[rgba(139,92,246,0.5)] hover:shadow-[0_0_16px_rgba(139,92,246,0.15)] disabled:opacity-50 ${
                activeOp === op.id ? "border-[rgba(139,92,246,0.6)] animate-nio-pulse" : ""
              }`}
            >
              <span className="text-lg">{op.icon}</span>
              <p className="mt-1 text-xs font-medium text-[var(--fg-primary)] group-hover:text-white">{op.label}</p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="cosmos-card glow-border rounded-xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--fg-primary)]">{result.question}</p>
                <p className="mt-2 text-sm text-[var(--fg-secondary)]">{result.outcome}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(true)}
                className="shrink-0 rounded-full border border-[rgba(139,92,246,0.4)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] hover:border-[rgba(139,92,246,0.7)] hover:text-[var(--fg-primary)]"
              >
                Cascade detail
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                <motion.div
                  className="h-full rounded-full bg-rose-500/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.risk * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="text-xs font-medium text-rose-400">{Math.round(result.risk * 100)}% collapse risk</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Cascade effects</p>
                <ul className="space-y-1">
                  {result.cascadeEffects.map((e, i) => (
                    <li key={i} className="text-xs text-[var(--fg-secondary)]">→ {e}</li>
                  ))}
                </ul>
              </div>
              {result.collapsed.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-rose-400/80 mb-1">Collapsed</p>
                  {result.collapsed.map((c) => (
                    <span key={c} className="mr-1 inline-block rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">{c}</span>
                  ))}
                </div>
              )}
              {result.amplified.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400/80 mb-1">Amplified</p>
                  {result.amplified.map((a) => (
                    <span key={a} className="mr-1 inline-block rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{a}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhaseShiftPanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Cascade Analysis">
        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--fg-primary)]">{result.question}</p>
            <p className="text-sm text-[var(--fg-secondary)]">{result.outcome}</p>
            <div className="space-y-2">
              {result.cascadeEffects.map((e, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgba(192,132,252,0.8)]" />
                  <span className="text-sm text-[var(--fg-secondary)]">{e}</span>
                </div>
              ))}
            </div>
            {result.collapsed.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-rose-400/80 mb-2">Threads collapsed</p>
                {result.collapsed.map((c) => (
                  <p key={c} className="text-sm text-rose-300">✕ {c}</p>
                ))}
              </div>
            )}
            {result.amplified.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-400/80 mb-2">Threads amplified</p>
                {result.amplified.map((a) => (
                  <p key={a} className="text-sm text-emerald-300">▲ {a}</p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[var(--fg-muted)]">Run a simulation first.</p>
        )}
      </PhaseShiftPanel>

      {history.length > 1 && (
        <div className="cosmos-card rounded-xl p-6">
          <h3 className="section-label mb-3 text-xs font-medium uppercase tracking-wide">Simulation history</h3>
          <div className="space-y-2">
            {history.slice(1).map((h, idx) => (
              <div key={`${h.id}-${idx}`} className="flex items-center justify-between rounded-lg border border-[rgba(139,92,246,0.15)] bg-[rgba(19,16,28,0.4)] px-3 py-2">
                <span className="text-xs text-[var(--fg-secondary)]">{h.question}</span>
                <span className="text-xs text-rose-400/80">{Math.round(h.risk * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-6">
        <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Active universe</p>
        <p className="mt-1 font-medium text-[var(--fg-primary)]">{universe.name}</p>
        <Link href="/nexus" className="mt-4 inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
          ← Origin Nexus
        </Link>
      </div>
    </div>
  );
}
