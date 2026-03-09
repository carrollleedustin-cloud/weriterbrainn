"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getNarrativeStrategy,
  getNarrativePlotThreads,
  getNarrativeObjects,
  getCanonFacts,
  getMe,
} from "@/lib/api";

type AlertCategory = "continuity" | "pacing" | "opportunity" | "thread" | "character";

export default function SignalPage() {
  const [strategy, setStrategy] = useState<{
    suggestions?: Array<{ title: string; description: string; priority?: string }>;
    opportunities?: Array<{ title: string; description: string }>;
  } | null>(null);
  const [threads, setThreads] = useState<Array<{ name: string; status: string }>>([]);
  const [objectCounts, setObjectCounts] = useState({ characters: 0, events: 0, canonFacts: 0 });
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
          const objects = Array.isArray(objs) ? objs : [];
          setObjectCounts({
            characters: objects.filter((o: { object_type?: string }) => (o.object_type || "").toLowerCase() === "character").length,
            events: objects.filter((o: { object_type?: string }) => (o.object_type || "").toLowerCase() === "event").length,
            canonFacts: Array.isArray(canon?.facts) ? canon.facts.length : 0,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const dormantThreads = threads.filter((t) =>
    ["dormant", "abandoned", "resolved"].includes((t.status || "").toLowerCase())
  );
  const activeCount = threads.filter((t) =>
    ["active", "escalating", "converging"].includes((t.status || "").toLowerCase())
  ).length;

  const alerts: Array<{ category: AlertCategory; title: string; description: string; severity: "low" | "medium" | "high"; action?: string }> = [];
  if (strategy?.suggestions?.length) {
    strategy.suggestions.slice(0, 3).forEach((s) => {
      const priority = (s.priority || "").toLowerCase();
      const severity = priority === "high" ? "high" : priority === "medium" ? "medium" : "low";
      alerts.push({
        category: "pacing",
        title: s.title,
        description: s.description,
        severity,
        action: "/universe?tab=strategy",
      });
    });
  }
  if (strategy?.opportunities?.length) {
    strategy.opportunities.forEach((o) => {
      alerts.push({
        category: "opportunity",
        title: o.title,
        description: o.description,
        severity: "low",
        action: "/universe?tab=strategy",
      });
    });
  }
  if (dormantThreads.length > 0 && activeCount === 0 && threads.length > 0) {
    alerts.push({
      category: "thread",
      title: "All threads dormant",
      description: `${dormantThreads.length} plot thread(s) are dormant or resolved. Consider reactivating or resolving payoff.`,
      severity: "medium",
      action: "/universe?tab=threads",
    });
  }
  if (objectCounts.canonFacts === 0 && (objectCounts.characters > 0 || objectCounts.events > 0)) {
    alerts.push({
      category: "continuity",
      title: "No canon facts recorded",
      description: "Extract more text to establish canon. Compile new scenes to validate continuity.",
      severity: "low",
      action: "/universe?tab=canon",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">Signal</h1>
        <p className="text-sm text-[var(--fg-muted)]">
          Alerts, opportunities, continuity pressure — what the story needs next.
        </p>
      </div>

      {authRequired && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to view narrative signals.
        </div>
      )}

      {loading && !authRequired ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-[rgba(139,92,246,0.2)] p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-[75%]" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 && !authRequired ? (
        <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 text-center">
          <p className="text-[var(--fg-secondary)]">No signals yet.</p>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Extract narrative text and run Compile to surface continuity pressure, pacing suggestions, and opportunities.
          </p>
          <Link href="/universe" className="mt-4 inline-block rounded-md bg-[rgba(139,92,246,0.2)] px-4 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]">
            Story Universe
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`rounded-md border p-4 ${
                a.category === "opportunity"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : a.severity === "high"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded bg-[rgba(139,92,246,0.15)] px-1.5 py-0.5 text-xs uppercase tracking-wide text-[var(--fg-muted)]">
                    {a.category}
                  </span>
                  <h3 className="mt-2 font-medium text-[var(--fg-primary)]">{a.title}</h3>
                  <p className="mt-1 text-sm text-[var(--fg-muted)]">{a.description}</p>
                </div>
                {a.action && (
                  <Link
                    href={a.action}
                    className="shrink-0 rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
                  >
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/pulse" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Pulse
        </Link>
        <Link href="/universe" className="rounded-md bg-[rgba(139,92,246,0.2)] px-3 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]">
          Story Universe
        </Link>
        <Link href="/universe?tab=compile" className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-2 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]">
          Compile
        </Link>
      </div>
    </div>
  );
}
