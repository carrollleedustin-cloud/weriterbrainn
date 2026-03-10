"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { SecretHeat } from "@/components/nio/SecretHeat";
import { useAwakening } from "@/store/awakening";
import { PressureHUD } from "@/components/nio/PressureHUD";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import { AuthGate } from "@/components/nio/AuthGate";
import { dimensionRegistry } from "@/lib/dimension-registry";

export default function NexusPage() {
  useNarrativeInit();

  const { universeName } = useAwakening();
  const loading = useNarrativeStore((s) => s.loading);
  const universe = useNarrativeStore((s) => s.universe);
  const health = useNarrativeStore((s) => s.health);
  const entities = useNarrativeStore((s) => s.entities);
  const threads = useNarrativeStore((s) => s.threads);
  const oracle = useNarrativeStore((s) => s.oracle);
  const chronos = useNarrativeStore((s) => s.chronos);
  const characters = useNarrativeStore((s) => s.characters);

  const portals = dimensionRegistry.getAll().filter((d) => d.id !== "ascend");

  const secretsWithHeat = [{ id: "s-betrayal", name: "The Betrayal", exposureRisk: 0.72 }];
  const pressureMetrics = [
    { id: "tension", label: "Tension", value: Math.round(health.tensionLoad * 100), max: 100, severity: "medium" as const },
    { id: "instability", label: "Instability", value: Math.round(health.instability * 100), max: 100, severity: "low" as const },
    { id: "thread-load", label: "Thread load", value: threads.length, max: 8, severity: "low" as const },
    { id: "debt", label: "Unresolved debt", value: 2, max: 5, severity: "medium" as const },
    { id: "coherence", label: "Thematic coherence", value: 78, max: 100, severity: "low" as const },
  ];
  const displayEntities = characters.length > 0
    ? characters.map((c) => ({ id: c.id, name: c.name, type: "character" }))
    : entities.filter((e) => e.type === "character").map((e) => ({ id: e.id, name: e.name, type: e.type }));
  const displayUniverse = universeName || universe.name;

  const header = (
    <DimensionHeader
      title={<span className="gradient-text">{displayUniverse}</span>}
      subtitle="Living command center for story universes. Pressure, causality, and consequence converge here."
    />
  );

  return (
    <AuthGate fallbackHeader={header}>
      <div className="space-y-10">
        {header}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-64 rounded bg-[rgba(139,92,246,0.1)]" />
            <div className="grid gap-4 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded bg-[rgba(139,92,246,0.05)]" />)}
            </div>
          </div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Pressure HUD</p>
              <PressureHUD metrics={pressureMetrics} />
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="cosmos-card glow-border relative overflow-hidden rounded-xl p-6 animate-nio-pulse"
              >
                <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-nio-pulse" title={`Threat of collapse: ${Math.round(health.threatOfCollapse * 100)}%`} />
                <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Universe Heart</h3>
                <div className="flex flex-wrap gap-6">
                  {[
                    { label: "Narrative Health", value: health.narrativeHealth, color: "bg-[linear-gradient(90deg,#8b5cf6,#c084fc)]", delay: 0.3 },
                    { label: "Instability", value: health.instability, color: "bg-amber-500/80", delay: 0.4 },
                    { label: "Tension Load", value: health.tensionLoad, color: "bg-rose-500/80", delay: 0.5 },
                    { label: "Unresolved mass", value: health.unresolvedMass, color: "bg-violet-500/80", delay: 0.6 },
                    { label: "Completion gravity", value: health.completionGravity, color: "bg-emerald-500/80", delay: 0.7 },
                  ].map((m) => (
                    <div key={m.label} className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{m.label}</p>
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-[rgba(139,92,246,0.2)]">
                        <motion.div className={`h-full rounded-full ${m.color}`} initial={{ width: 0 }} animate={{ width: `${Math.round(m.value * 100)}%` }} transition={{ duration: 1, delay: m.delay }} />
                      </div>
                      <p className="text-xs text-[var(--fg-secondary)]">{Math.round(m.value * 100)}%</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[var(--fg-muted)]">{universe.seed}</p>
                <p className="mt-2 text-[10px] text-rose-400/80">Threat of collapse: {Math.round(health.threatOfCollapse * 100)}%</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="cosmos-card overflow-hidden rounded-xl p-6">
                <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Oracle Presence</h3>
                <ul className="space-y-2">
                  {oracle.slice(0, 3).map((o) => (
                    <li key={o.id} className={`rounded-lg border px-3 py-2 text-xs ${o.severity === "high" ? "border-amber-500/40 bg-amber-500/5" : "border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.05)]"}`}>
                      <span className="font-medium text-[var(--fg-primary)]">{o.message}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-3">
                  <Link href="/chat" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Invoke Oracle →</Link>
                  <Link href="/ascend" className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Ascend →</Link>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Character Constellation</h3>
              <div className="flex flex-wrap gap-3">
                {displayEntities.slice(0, 6).map((e) => (
                  <Link key={e.id} href={e.type === "character" ? `/mindspace/${e.id}` : "/universe"} className="group flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.06)] px-4 py-2 transition hover:border-[rgba(139,92,246,0.6)] hover:bg-[rgba(139,92,246,0.12)]">
                    <span className="h-2 w-2 rounded-full bg-[rgba(192,132,252,0.8)] shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                    <span className="text-sm text-[var(--fg-primary)] group-hover:text-white">{e.name}</span>
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Timeline Rivers</h3>
              <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                {chronos.presentLine.map((m, i) => (
                  <span key={i} className="river-stone shrink-0 rounded-lg border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)]">{m}</span>
                ))}
              </div>
              {chronos.paradoxes.length > 0 && (
                <p className="mt-2 text-xs text-amber-400">⚠ {chronos.paradoxes.length} paradox{chronos.paradoxes.length > 1 ? "es" : ""} detected</p>
              )}
              <Link href="/river" className="mt-2 inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">River of Time →</Link>
            </motion.div>

            {secretsWithHeat.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Secret Heat</h3>
                <SecretHeat secrets={secretsWithHeat} />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Portal Array</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portals.map((p, i) => (
                  <motion.div key={p.id} whileHover={{ scale: 1.02 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.25 + i * 0.04 }}>
                    <Link href={p.href} className="portal-card group relative block overflow-hidden rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(19,16,28,0.8)] p-5 transition-all duration-300 hover:border-[rgba(139,92,246,0.6)] hover:shadow-[0_0_32px_rgba(139,92,246,0.2),inset_0_0_30px_rgba(139,92,246,0.03)]">
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(139,92,246,0.08)] via-transparent to-[rgba(192,132,252,0.04)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.4)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-[rgba(139,92,246,0.6)] transition-colors group-hover:text-[rgba(192,132,252,0.9)]">{p.glyph}</span>
                          <p className="font-medium text-[var(--fg-primary)] transition-colors group-hover:text-white">{p.label}</p>
                        </div>
                        <p className="mt-1.5 text-xs text-[var(--fg-muted)] group-hover:text-[var(--fg-secondary)] transition-colors">{p.description}</p>
                        <span className="mt-3 inline-block text-xs text-[rgba(139,92,246,0.8)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5">Enter →</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="cosmos-card rounded-xl p-6">
              <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Plot Loom Field</h3>
              <div className="flex flex-wrap gap-3">
                {threads.map((t) => (
                  <div key={t.id} className={`rounded-lg border px-4 py-2 text-sm ${t.status === "rising" ? "border-emerald-500/40 bg-emerald-500/10" : t.status === "knot" ? "border-rose-500/40 bg-rose-500/10" : "border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)]"}`}>
                    <span className="text-[var(--fg-primary)]">{t.name}</span>
                    <span className="ml-2 text-[10px] uppercase text-[var(--fg-muted)]">{t.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AuthGate>
  );
}
