"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNarrativeTimeline, getMe } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

type TimelineEvent = {
  id: string;
  name: string;
  summary?: string;
  temporal?: unknown;
  caused_by?: Array<{ event_id: string; name: string }>;
};

export default function RiverPage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      getNarrativeTimeline()
        .then((r) => setEvents(r.events || []))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false));
    });
  }, []);

  if (authRequired) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">The River</h1>
          <p className="text-sm text-[var(--fg-muted)]">Timeline + causality — events flow downstream.</p>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to view your story timeline.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-40 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">The River</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Timeline + causality — events flow downstream. Cause and effect.
          </p>
        </div>
        <Link
          href="/universe?tab=timeline"
          className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
        >
          Full Universe
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="cosmos-card rounded-xl p-8 text-center">
          <p className="text-[var(--fg-muted)]">No events yet.</p>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Extract narrative text in Story Universe to build the timeline.
          </p>
          <Link href="/universe" className="mt-4 inline-block text-sm text-[rgba(139,92,246,0.9)] hover:underline">
            Story Universe →
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-6 relative">
            <div className="absolute inset-0 pointer-events-none animate-river-flow rounded-lg opacity-50" aria-hidden />
            <div className="flex min-w-max items-stretch gap-3 px-1 relative z-[1]">
              {events.map((ev, i) => (
                <div key={ev.id} className="relative flex shrink-0 items-center">
                  {/* Causality link from previous event */}
                  {i > 0 && (
                    <div className="absolute -left-4 top-1/2 h-0.5 w-6 -translate-y-1/2 border-t-2 border-dashed border-[rgba(139,92,246,0.4)]" />
                  )}
                  <div
                    onMouseEnter={() => setHovered(ev.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`group relative flex w-44 flex-col rounded-xl cosmos-card p-4 transition-all ${(ev.caused_by?.length ?? 0) > 0 ? "animate-ripple border-[rgba(139,92,246,0.35)]" : ""} ${
                      hovered === ev.id
                        ? "border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.12)] shadow-md"
                        : "border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/80 hover:border-[rgba(139,92,246,0.35)]"
                    }`}
                  >
                    <span className="mb-2 font-mono text-xs text-[var(--fg-muted)]">{i + 1}</span>
                    <p className="font-medium text-[var(--fg-primary)] line-clamp-2">{ev.name}</p>
                    {ev.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--fg-muted)]">{ev.summary}</p>
                    )}
                    {ev.temporal != null && (
                      <p className="mt-1 text-xs text-amber-400/90">When: {String(ev.temporal)}</p>
                    )}
                    {(ev.caused_by || []).length > 0 && (
                      <p className="mt-2 border-t border-[rgba(139,92,246,0.15)] pt-2 text-xs text-amber-400/90">
                        ← {ev.caused_by!.map((c) => c.name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--fg-muted)]">
            Flow: left → right. Dashed links show sequence. "← X" = caused by X.
          </p>
        </>
      )}
    </div>
  );
}
