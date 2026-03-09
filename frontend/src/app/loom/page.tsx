"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getNarrativePlotThreads, getMe } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

type PlotThread = {
  id: string;
  name: string;
  summary?: string;
  status: string;
  related_events?: string[];
};

function threadStatus(str: string): "active" | "flat" | "dormant" {
  const s = (str || "").toLowerCase();
  if (["active", "escalating", "converging"].includes(s)) return "active";
  if (["dormant", "abandoned", "resolved"].includes(s)) return "dormant";
  return "flat";
}

export default function LoomPage() {
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const knots = useMemo(() => {
    const eventToThreads = new Map<string, string[]>();
    threads.forEach((t) => {
      (t.related_events || []).forEach((e) => {
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

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      getNarrativePlotThreads()
        .then((r) => setThreads(r.threads || []))
        .catch(() => setThreads([]))
        .finally(() => setLoading(false));
    });
  }, []);

  if (authRequired) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">The Loom</h1>
          <p className="text-sm text-[var(--fg-muted)]">Plot threads — tension, payoffs, dormancy.</p>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to view plot threads.
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">The Loom</h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Plot threads — where tension builds, where threads intersect, where payoffs occur.
          </p>
        </div>
        <Link
          href="/universe?tab=threads"
          className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
        >
          Full Universe
        </Link>
      </div>

      {threads.length === 0 ? (
        <div className="cosmos-card rounded-xl p-8 text-center">
          <p className="text-[var(--fg-muted)]">No plot threads yet.</p>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Extract narrative text in Story Universe to discover threads.
          </p>
          <Link href="/universe" className="mt-4 inline-block text-sm text-[rgba(139,92,246,0.9)] hover:underline">
            Story Universe →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-[var(--fg-muted)]">
            ▲ Active · — Flat · ○ Dormant {knots.length > 0 && `· ◉ ${knots.length} knot(s)`}
          </p>
          {knots.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-400/90 mb-2">◉ Narrative knots (threads intersecting)</p>
              <ul className="space-y-1 text-xs text-[var(--fg-muted)]">
                {knots.map((k, i) => (
                  <li key={i}>Event &ldquo;{k.event}&rdquo; links {k.threadIds.length} threads</li>
                ))}
              </ul>
            </div>
          )}
          {threads.map((t) => {
            const status = threadStatus(t.status);
            const isExpanded = expanded === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setExpanded((prev) => (prev === t.id ? null : t.id))}
                className={`cursor-pointer rounded-xl cosmos-card p-4 transition-all ${
                  status === "active"
                    ? "border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.08)] shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                    : status === "dormant"
                      ? "border-[rgba(139,92,246,0.15)] bg-[var(--bg-raised)]/60 opacity-75"
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
                  <span className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-xs text-[var(--fg-muted)] capitalize">
                    {t.status || "unknown"}
                  </span>
                </div>
                {t.summary && <p className="mt-2 text-sm text-[var(--fg-muted)]">{t.summary}</p>}
                {isExpanded && t.related_events && t.related_events.length > 0 && (
                  <p className="mt-2 border-t border-[rgba(139,92,246,0.15)] pt-2 text-xs text-[var(--fg-muted)]">
                    Events: {t.related_events.join(", ")}
                  </p>
                )}
                {!t.summary && !isExpanded && (
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">Click to expand</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
