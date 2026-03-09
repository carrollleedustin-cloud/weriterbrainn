"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNarrativeStrategy, getNarrativePlotThreads, getNarrativeObjects, getCanonFacts, getMe } from "@/lib/api";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";

export default function PulsePage() {
  const [strategy, setStrategy] = useState<{
    summary?: string;
    suggestions?: Array<{ title: string; description: string; priority?: string }>;
    opportunities?: Array<{ title: string; description: string }>;
  } | null>(null);
  const [threads, setThreads] = useState<Array<{ name: string; status: string }>>([]);
  const [objects, setObjects] = useState<Array<{ object_type: string }>>([]);
  const [canonCount, setCanonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      Promise.all([
        getNarrativeStrategy(),
        getNarrativePlotThreads(),
        getNarrativeObjects().catch(() => []),
        getCanonFacts().catch(() => ({ facts: [] })),
      ])
        .then(([strat, th, objs, canon]) => {
          setStrategy(strat);
          setThreads(th.threads || []);
          setObjects(Array.isArray(objs) ? objs : []);
          setCanonCount(Array.isArray(canon?.facts) ? canon.facts.length : 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const activeThreads = threads.filter((t) =>
    ["active", "escalating", "converging"].includes((t.status || "").toLowerCase())
  );
  const charCount = objects.filter((o) => (o.object_type || "").toLowerCase() === "character").length;
  const eventCount = objects.filter((o) => (o.object_type || "").toLowerCase() === "event").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">Pulse</h1>
        <p className="text-sm text-[var(--fg-muted)]">Living overview — active threads, momentum, opportunities.</p>
      </div>

      {authRequired && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to view your story pulse.
        </div>
      )}

      {loading && !authRequired ? (
        <SkeletonCardGrid count={4} />
      ) : (
        <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Active threads</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">
              {activeThreads.length} / {threads.length}
            </p>
            {activeThreads.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-[var(--fg-secondary)]">
                {activeThreads.slice(0, 5).map((t, i) => (
                  <li key={i}>• {t.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Story size</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">{charCount}</p>
            <p className="text-xs text-[var(--fg-muted)]">characters · {eventCount} events · {canonCount} canon facts</p>
          </div>
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 sm:col-span-2">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Strategic summary</h3>
            <p className="mt-2 text-sm text-[var(--fg-secondary)]">
              {strategy?.summary || "Load strategy in Story Universe for guidance."}
            </p>
          </div>
        </div>
        {strategy?.suggestions && strategy.suggestions.length > 0 && (
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Suggestions</h3>
            <ul className="mt-2 space-y-2">
              {strategy.suggestions.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-[var(--fg-primary)]">{s.title}</span>
                  <p className="text-[var(--fg-muted)]">{s.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        </div>
      )}

      {strategy?.opportunities?.length ? (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Opportunities</h3>
          <ul className="mt-2 space-y-2">
            {strategy.opportunities.map((o, i) => (
              <li key={i}>
                <span className="font-medium text-[var(--fg-primary)]">{o.title}</span>
                <p className="text-sm text-[var(--fg-muted)]">{o.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link href="/universe" className="rounded-md bg-[rgba(139,92,246,0.2)] px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]">
          Story Universe
        </Link>
        <Link href="/universe?tab=compile" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Compile
        </Link>
        <Link href="/river" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          River
        </Link>
        <Link href="/loom" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Loom
        </Link>
        <Link href="/cast" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Cast
        </Link>
        <Link href="/signal" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Signal
        </Link>
      </div>
    </div>
  );
}
