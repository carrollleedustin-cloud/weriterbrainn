"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNarrativeStrategy, getNarrativePlotThreads, getNarrativeProject, getMe } from "@/lib/api";

export default function PulsePage() {
  const [strategy, setStrategy] = useState<{
    summary?: string;
    suggestions?: Array<{ title: string; description: string; priority?: string }>;
    opportunities?: Array<{ title: string; description: string }>;
  } | null>(null);
  const [threads, setThreads] = useState<Array<{ name: string; status: string }>>([]);
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
      ])
        .then(([strat, th]) => {
          setStrategy(strat);
          setThreads(th.threads || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const activeThreads = threads.filter((t) =>
    ["active", "escalating", "converging"].includes((t.status || "").toLowerCase())
  );

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
        <p className="text-[var(--fg-muted)]">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
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
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Strategic summary</h3>
            <p className="mt-2 text-sm text-[var(--fg-secondary)]">
              {strategy?.summary || "Load strategy in Story Universe for guidance."}
            </p>
          </div>
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

      <div className="flex gap-2">
        <Link href="/universe">
          <span className="rounded-md bg-[rgba(139,92,246,0.2)] px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]">
            Story Universe
          </span>
        </Link>
        <Link href="/cast">
          <span className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
            Cast
          </span>
        </Link>
      </div>
    </div>
  );
}
