"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNarrativeTimeline } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { CausalityRipples } from "@/components/nio/CausalityRipples";
import { MemoryGhost } from "@/components/nio/MemoryGhost";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import { AuthGate } from "@/components/nio/AuthGate";

type TimelineEvent = {
  id: string;
  name: string;
  summary?: string;
  temporal?: unknown;
  caused_by?: Array<{ event_id: string; name: string }>;
};

export default function RiverPage() {
  useNarrativeInit();

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const chronos = useNarrativeStore((s) => s.chronos);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [panelEventId, setPanelEventId] = useState<string | null>(null);
  const panelEvent = events.find((e) => e.id === panelEventId);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { setLoading(false); return; }
    getNarrativeTimeline()
      .then((r) => setEvents(r.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  const header = (
    <DimensionHeader
      title={<>River of <span className="gradient-text">Time</span></>}
      subtitle="Fluid chronology. Present = current. Past = eddies. Future = fog. Branch points = deltas."
      stats={
        <Link href="/universe?tab=timeline" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Full Universe
        </Link>
      }
    />
  );

  return (
    <AuthGate fallbackHeader={header}>
      <div className="space-y-6">
        {header}

        {chronos.paradoxes.length > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-400/90 mb-1">Paradox storms detected</p>
            <ul className="space-y-1 text-xs text-[var(--fg-muted)]">
              {chronos.paradoxes.map((p) => (
                <li key={p.id}>⚠ {p.description} (severity {Math.round(p.severity * 100)}%)</li>
              ))}
            </ul>
          </div>
        )}

        <CausalityRipples
          source="Storm Gate event"
          propagations={[
            { id: "1", label: "Marcus arc", affected: ["c-marcus"] },
            { id: "2", label: "Ilyra knowledge", affected: ["c-ilyra"] },
            { id: "3", label: "Kassen hunt thread", affected: ["t-4"] },
          ]}
        />

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 w-40 shrink-0 rounded bg-[rgba(139,92,246,0.05)]" />
              ))}
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="cosmos-card rounded-xl p-8 text-center">
            <p className="text-[var(--fg-muted)]">No events yet.</p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">Extract narrative text in Story Universe to build the timeline.</p>
            <Link href="/universe" className="mt-4 inline-block text-sm text-[rgba(139,92,246,0.9)] hover:underline">Story Universe →</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto pb-6 relative">
              <div className="absolute inset-0 pointer-events-none animate-river-flow rounded-lg opacity-50" aria-hidden />
              <div className="flex min-w-max items-stretch gap-3 px-1 relative z-[1]">
                {events.map((ev, i) => (
                  <div key={ev.id} className="relative flex shrink-0 items-center">
                    {i > 0 && <div className="absolute -left-4 top-1/2 h-0.5 w-6 -translate-y-1/2 border-t-2 border-dashed border-[rgba(139,92,246,0.4)]" />}
                    <MemoryGhost label="timeline event">
                      <div
                        onClick={() => setPanelEventId(ev.id)}
                        onMouseEnter={() => setHovered(ev.id)}
                        onMouseLeave={() => setHovered(null)}
                        className={`group relative flex w-44 flex-col rounded-xl cosmos-card p-4 transition-all ${(ev.caused_by?.length ?? 0) > 0 ? "animate-ripple border-[rgba(139,92,246,0.35)]" : ""} ${hovered === ev.id ? "border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.12)] shadow-md" : "border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/80 hover:border-[rgba(139,92,246,0.35)]"}`}
                      >
                        <span className="mb-2 font-mono text-xs text-[var(--fg-muted)]">{i + 1}</span>
                        <p className="font-medium text-[var(--fg-primary)] line-clamp-2">{ev.name}</p>
                        {ev.summary && <p className="mt-1 line-clamp-2 text-xs text-[var(--fg-muted)]">{ev.summary}</p>}
                        {ev.temporal != null && <p className="mt-1 text-xs text-amber-400/90">When: {String(ev.temporal)}</p>}
                        {(ev.caused_by || []).length > 0 && (
                          <p className="mt-2 border-t border-[rgba(139,92,246,0.15)] pt-2 text-xs text-amber-400/90">
                            ← {ev.caused_by!.map((c) => c.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </MemoryGhost>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--fg-muted)]">
              Flow: left → right. Dashed links show sequence. &ldquo;← X&rdquo; = caused by X. Click an event for details.
            </p>
          </>
        )}

        <PhaseShiftPanel open={!!panelEventId} onClose={() => setPanelEventId(null)} title={panelEvent?.name ?? "Event"}>
          {panelEvent ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--fg-primary)]">{panelEvent.name}</p>
              {panelEvent.summary && <p className="text-sm text-[var(--fg-secondary)]">{panelEvent.summary}</p>}
              {panelEvent.temporal != null && (
                <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Temporal position</p>
                  <p className="text-sm text-amber-400/90">{String(panelEvent.temporal)}</p>
                </div>
              )}
              {(panelEvent.caused_by ?? []).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Causal parents</p>
                  {panelEvent.caused_by!.map((c) => (
                    <div key={c.event_id} className="mb-1 flex items-center gap-2 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] px-3 py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                      <span className="text-sm text-[var(--fg-secondary)]">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Temporal assessment</p>
                <p className="text-sm text-[var(--fg-secondary)]">
                  {(panelEvent.caused_by ?? []).length > 0
                    ? `Event is downstream of ${panelEvent.caused_by!.length} cause(s). Modifying those causes would destabilize this event.`
                    : "Root event — no causal dependencies. Safe to relocate in the timeline."}
                </p>
              </div>
            </div>
          ) : null}
        </PhaseShiftPanel>
      </div>
    </AuthGate>
  );
}
