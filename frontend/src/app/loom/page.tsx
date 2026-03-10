"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { TensionVeins } from "@/components/nio/TensionVeins";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import { AuthGate } from "@/components/nio/AuthGate";

function threadStatus(str: string): "active" | "flat" | "dormant" {
  const s = (str || "").toLowerCase();
  if (["active", "escalating", "converging", "rising"].includes(s)) return "active";
  if (["dormant", "abandoned", "resolved"].includes(s)) return "dormant";
  return "flat";
}

export default function LoomPage() {
  useNarrativeInit();

  const loading = useNarrativeStore((s) => s.loading);
  const threads = useNarrativeStore((s) => s.threads);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [panelThread, setPanelThread] = useState<string | null>(null);
  const panelData = threads.find((t) => t.id === panelThread);

  const knots = useMemo(() => {
    const eventToThreads = new Map<string, string[]>();
    threads.forEach((t) => {
      (t.participants || []).forEach((e) => {
        const arr = eventToThreads.get(e) || [];
        if (!arr.includes(t.id)) arr.push(t.id);
        eventToThreads.set(e, arr);
      });
    });
    const out: Array<{ event: string; threadIds: string[] }> = [];
    eventToThreads.forEach((ids, event) => {
      if (ids.length >= 2) out.push({ event, threadIds: ids });
    });
    return out;
  }, [threads]);

  const header = (
    <DimensionHeader
      title={<>Loom of <span className="gradient-text">Fate</span></>}
      subtitle="Active threads, intersecting arcs, knot density. Pull, cut, splice."
      stats={
        <Link href="/universe?tab=threads" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Full Universe
        </Link>
      }
    />
  );

  return (
    <AuthGate fallbackHeader={header}>
      <div className="space-y-6">
        {header}

        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 w-full rounded bg-[rgba(139,92,246,0.05)]" />)}
          </div>
        ) : (
          <>
            {threads.length > 0 && (
              <div className="cosmos-card rounded-xl p-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Tension Veins</p>
                <TensionVeins
                  nodes={threads.map((t, i) => ({
                    id: t.id, label: t.name, heat: t.heat ?? 0.6,
                    x: 30 + i * 40, y: 30 + (i % 2) * 40,
                  }))}
                />
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xs text-[var(--fg-muted)]">
                ▲ Active · — Flat · ○ Dormant {knots.length > 0 && `· ◉ ${knots.length} knot(s)`}
              </p>
              {knots.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="text-xs font-medium text-amber-400/90 mb-2">◉ Narrative knots (threads intersecting)</p>
                  <ul className="space-y-1 text-xs text-[var(--fg-muted)]">
                    {knots.map((k, i) => <li key={i}>Event &ldquo;{k.event}&rdquo; links {k.threadIds.length} threads</li>)}
                  </ul>
                </div>
              )}
              {threads.map((t) => {
                const status = threadStatus(t.status);
                const isExpanded = expanded === t.id;
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded((prev) => (prev === t.id ? null : t.id))}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded((prev) => (prev === t.id ? null : t.id)); } }}
                    className={`cursor-pointer rounded-xl cosmos-card p-4 transition-all ${
                      status === "active" ? "border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.08)] shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                        : status === "dormant" ? "border-[rgba(139,92,246,0.15)] bg-[var(--bg-raised)]/60 opacity-75"
                        : "border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/80"
                    } ${isExpanded ? "ring-2 ring-[rgba(139,92,246,0.4)]" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 text-sm ${status === "active" ? "text-emerald-400" : status === "dormant" ? "text-[var(--fg-muted)]" : "text-[var(--fg-secondary)]"}`}>
                          {status === "active" ? "▲" : status === "dormant" ? "○" : "—"}
                        </span>
                        <p className="font-medium text-[var(--fg-primary)]">{t.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--fg-muted)]">heat {Math.round((t.heat ?? 0.5) * 100)}%</span>
                        <span className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-xs text-[var(--fg-muted)] capitalize">{t.status || "unknown"}</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 border-t border-[rgba(139,92,246,0.15)] pt-2">
                        {t.participants && t.participants.length > 0 && (
                          <p className="text-xs text-[var(--fg-muted)]">Participants: {t.participants.join(", ")}</p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPanelThread(t.id); }}
                          className="mt-2 rounded-full border border-[rgba(139,92,246,0.4)] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] hover:border-[rgba(139,92,246,0.7)] hover:text-[var(--fg-primary)]"
                        >
                          Thread analysis
                        </button>
                      </div>
                    )}
                    {!isExpanded && <p className="mt-1 text-xs text-[var(--fg-muted)]">Click to expand</p>}
                  </div>
                );
              })}
            </div>

            <PhaseShiftPanel open={!!panelThread} onClose={() => setPanelThread(null)} title={panelData?.name ?? "Thread Analysis"}>
              {panelData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${threadStatus(panelData.status) === "active" ? "text-emerald-400" : "text-[var(--fg-muted)]"}`}>
                      {threadStatus(panelData.status) === "active" ? "▲" : threadStatus(panelData.status) === "dormant" ? "○" : "—"}
                    </span>
                    <span className="text-sm font-medium text-[var(--fg-primary)]">{panelData.name}</span>
                    <span className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-[10px] text-[var(--fg-muted)] capitalize">{panelData.status || "unknown"}</span>
                  </div>
                  <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Heat</p>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                        <div className="h-full rounded-full bg-[rgba(139,92,246,0.7)]" style={{ width: `${(panelData.heat ?? 0.5) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-[var(--fg-primary)]">{Math.round((panelData.heat ?? 0.5) * 100)}%</span>
                    </div>
                  </div>
                  {panelData.participants && panelData.participants.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Participants</p>
                      <div className="flex flex-wrap gap-1.5">
                        {panelData.participants.map((p) => (
                          <span key={p} className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-2 py-0.5 text-xs text-[var(--fg-secondary)]">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Structural assessment</p>
                    <p className="text-sm text-[var(--fg-secondary)]">
                      {(panelData.heat ?? 0.5) > 0.8
                        ? "Critical heat. This thread is approaching climax. Ensure all participant arcs converge or explicitly diverge."
                        : (panelData.heat ?? 0.5) > 0.5
                          ? "Active tension. Thread is carrying narrative weight. Monitor for overload if combined with adjacent threads."
                          : "Low energy. Thread risks stagnation. Inject a complication, revelation, or participant crisis."}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Knot involvement</p>
                    <p className="text-sm text-[var(--fg-secondary)]">
                      {knots.some((k) => k.threadIds.includes(panelData.id))
                        ? `This thread intersects with ${knots.filter((k) => k.threadIds.includes(panelData.id)).length} narrative knot(s). High entanglement — changes propagate widely.`
                        : "No knot involvement. This thread runs independently — safe to modify without cascade risk."}
                    </p>
                  </div>
                </div>
              ) : null}
            </PhaseShiftPanel>
          </>
        )}
      </div>
    </AuthGate>
  );
}
