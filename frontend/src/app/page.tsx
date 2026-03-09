"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  getMe,
  getNarrativeObjects,
  getNarrativeEdges,
  getNarrativePlotThreads,
  getNarrativeStrategy,
  getNarrativeTimeline,
  getNarrativeCharacters,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type PlotThread = { id: string; name: string; status: string; summary?: string };
type TimelineEvent = { id: string; name: string; summary?: string; temporal?: unknown };

export default function Home() {
  const [objects, setObjects] = useState<Array<{ id: string; name: string; object_type: string; summary?: string }>>([]);
  const [edges, setEdges] = useState<Array<{ source_id: string; target_id: string }>>([]);
  const [threads, setThreads] = useState<PlotThread[]>([]);
  const [strategy, setStrategy] = useState<{
    summary?: string;
    suggestions?: Array<{ title: string; description: string; priority?: string }>;
    opportunities?: Array<{ title: string; description: string }>;
  } | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [characters, setCharacters] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [selectedNode, setSelectedNode] = useState<{ id: string; name: string; object_type: string; summary?: string } | null>(null);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }
      Promise.all([
        getNarrativeObjects(),
        getNarrativeEdges(),
        getNarrativePlotThreads().catch(() => ({ threads: [] })),
        getNarrativeStrategy().catch(() => null),
        getNarrativeTimeline().catch(() => ({ events: [] })),
        getNarrativeCharacters().catch(() => []),
      ]).then(([objs, edgs, th, strat, tl, chars]) => {
        setObjects(objs);
        setEdges(edgs);
        setThreads(th.threads || []);
        setStrategy(strat);
        setTimelineEvents(tl.events || []);
        setCharacters(Array.isArray(chars) ? chars : []);
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  const graphData = useMemo(() => ({
    nodes: objects.map((o) => {
      const t = (o.object_type || "").toLowerCase();
      const val = t === "character" ? 4 : t === "event" ? 3 : t === "location" ? 2.5 : t === "plot_thread" ? 2 : 1;
      return { id: o.id, name: o.name, object_type: t, summary: o.summary, val };
    }),
    links: edges.map((e) => ({ source: e.source_id, target: e.target_id })),
  }), [objects, edges]);

  const typeColor = (t: string) => {
    switch (t) {
      case "character": return "#22c55e";
      case "event": return "#f59e0b";
      case "location": return "#3b82f6";
      case "plot_thread": return "#a855f7";
      case "secret": return "#ef4444";
      default: return "#c084fc";
    }
  };

  const activeThreads = threads.filter((t) =>
    ["active", "escalating", "converging"].includes((t.status || "").toLowerCase())
  );
  const insightItems = [
    ...(strategy?.suggestions?.slice(0, 2).map((s) => ({ type: "suggestion" as const, ...s })) ?? []),
    ...(strategy?.opportunities?.slice(0, 2).map((o) => ({ type: "opportunity" as const, ...o })) ?? []),
  ];
  const momentumPct = threads.length > 0
    ? Math.round((activeThreads.length / Math.max(threads.length, 1)) * 100)
    : 0;

  if (authRequired) {
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(135deg,rgba(24,17,40,0.95),rgba(16,12,28,0.85))] p-10 shadow-[var(--shadow-md)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.3),transparent_45%)]" />
          <div className="relative z-10 space-y-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
              NIOS · Narrative Intelligence
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--fg-primary)] sm:text-6xl">
              <span className="gradient-text">Your Story is Alive</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-[var(--fg-secondary)]">
              A Narrative Intelligence Operating System. Command your story universe — characters, plot threads, canon, causality.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:brightness-110"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-6 py-2 text-sm font-medium text-[var(--fg-primary)] transition hover:bg-[rgba(139,92,246,0.2)]"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/pulse", title: "Pulse", desc: "Story overview — active threads, momentum." },
            { href: "/universe", title: "Story Universe", desc: "Extract, compile, timeline, Q&A." },
            { href: "/cast", title: "Cast", desc: "Character intelligence." },
            { href: "/river", title: "River", desc: "Timeline + causality." },
            { href: "/loom", title: "Loom", desc: "Plot threads." },
          ].map(({ href, title, desc }) => (
            <Link key={href} href={href} className="aurora-border">
              <div className="h-full rounded-[var(--radius-lg)] bg-[var(--bg-raised)]/80 p-6 transition hover:translate-y-[-2px] hover:shadow-[var(--shadow-glow)]">
                <h2 className="text-lg font-semibold text-[var(--fg-primary)]">{title}</h2>
                <p className="mt-2 text-sm text-[var(--fg-secondary)]">{desc}</p>
              </div>
            </Link>
          ))}
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[480px] flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const hasStory = objects.length > 0 || threads.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">
            Narrative Command Center
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Your story universe — explore, command, connect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/universe"
            className="rounded-md border border-[rgba(139,92,246,0.3)] px-3 py-1.5 text-sm text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
          >
            Story Universe
          </Link>
          <Link
            href="/chat"
            className="rounded-md bg-[rgba(139,92,246,0.2)] px-3 py-1.5 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]"
          >
            AI Chat
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        {/* Story Galaxy — center */}
        <div className="relative min-h-[420px] overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(180deg,rgba(20,16,32,0.9),rgba(10,8,18,0.95))]" role="region" aria-label="Story Cosmos">
          {!hasStory ? (
            <div className="flex h-[420px] flex-col items-center justify-center gap-4 text-center">
              <p className="text-[var(--fg-muted)]">No story data yet.</p>
              <p className="max-w-sm text-sm text-[var(--fg-muted)]">
                Extract narrative text in Story Universe to build your galaxy.
              </p>
              <Link
                href="/universe"
                className="rounded-md bg-[rgba(139,92,246,0.2)] px-4 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]"
              >
                Go to Story Universe
              </Link>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex h-[420px] flex-col items-center justify-center gap-2 text-[var(--fg-muted)]">
              <p>No nodes yet — extract text to populate the graph.</p>
              <Link href="/universe" className="text-sm text-[rgba(139,92,246,0.9)] hover:underline">Extract</Link>
            </div>
          ) : (
            <>
              <ForceGraph2D
                graphData={graphData}
                nodeVal={(n: Record<string, unknown>) => (n.val as number) ?? 1}
                nodeRelSize={8}
                nodeLabel={(n: Record<string, unknown>) => (n.name as string) || "?"}
                nodeColor={(n: Record<string, unknown>) => typeColor((n.object_type as string) || "")}
                linkColor={() => "rgba(139,92,246,0.4)"}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowColor={() => "rgba(139,92,246,0.6)"}
                onNodeClick={(n: Record<string, unknown>) => {
                  const id = n.id as string;
                  setSelectedNode((prev) =>
                    prev?.id === id ? null : { id, name: (n.name as string) || "?", object_type: (n.object_type as string) || "", summary: n.summary as string }
                  );
                }}
                onBackgroundClick={() => setSelectedNode(null)}
              />
              {selectedNode && (
                <div className="absolute bottom-4 left-4 right-4 z-10 rounded-md border border-[rgba(139,92,246,0.3)] bg-[var(--bg-base)]/95 p-4 shadow-lg backdrop-blur">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--fg-primary)]">{selectedNode.name}</p>
                      <p className="text-xs text-[var(--fg-muted)] capitalize">{selectedNode.object_type}</p>
                      {selectedNode.summary && <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-secondary)]">{selectedNode.summary}</p>}
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="text-[var(--fg-muted)] hover:text-[var(--fg-primary)]" aria-label="Close">×</button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {(selectedNode.object_type || "").toLowerCase() === "character" ? (
                      <Link href={`/cast?c=${selectedNode.id}`} className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Cast →</Link>
                    ) : null}
                    <Link href="/universe" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Universe →</Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar: Active Threads, Momentum, Cast */}
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Active threads</h3>
            {threads.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--fg-muted)]">None yet</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {(activeThreads.length ? activeThreads : threads).slice(0, 5).map((t) => {
                  const isActive = ["active", "escalating", "converging"].includes((t.status || "").toLowerCase());
                  return (
                    <li key={t.id} className="flex items-center gap-2 text-sm">
                      <span className={`shrink-0 ${isActive ? "text-emerald-400" : "text-[var(--fg-muted)]"}`}>
                        {isActive ? "▲" : "○"}
                      </span>
                      <span className="truncate text-[var(--fg-secondary)]">{t.name}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <Link href="/loom" className="mt-2 block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
              View Loom →
            </Link>
          </div>

          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Momentum</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                <div
                  className="h-full rounded-full bg-[rgba(139,92,246,0.6)] transition-all"
                  style={{ width: `${momentumPct}%` }}
                />
              </div>
              <span className="text-sm text-[var(--fg-secondary)]">{momentumPct}%</span>
            </div>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">
              {activeThreads.length}/{threads.length} active
            </p>
          </div>

          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Cast</h3>
            {characters.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--fg-muted)]">None yet</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {characters.slice(0, 6).map((c) => (
                  <Link
                    key={c.id}
                    href={`/cast?c=${c.id}`}
                    className="rounded-full border border-[rgba(139,92,246,0.3)] px-2.5 py-0.5 text-xs text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/cast" className="mt-2 block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
              View Cast →
            </Link>
          </div>
        </div>
      </div>

      {/* AI Thought Stream */}
      {insightItems.length > 0 && (
        <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">AI Thought Stream</h3>
          <ul className="mt-3 space-y-3">
            {insightItems.map((item, i) => (
              <li
                key={i}
                className={`rounded-md border-l-2 p-2 pl-3 text-sm ${
                  item.type === "opportunity"
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.05)]"
                }`}
              >
                <p className="font-medium text-[var(--fg-primary)]">{item.title}</p>
                <p className="mt-0.5 text-[var(--fg-muted)]">{item.description}</p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-3">
            <Link href="/universe?tab=strategy" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Strategy →</Link>
            <Link href="/universe?tab=oracle" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Oracle →</Link>
          </div>
        </div>
      )}

      {/* Timeline sliver */}
      {timelineEvents.length > 0 && (
        <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">Timeline</h3>
            <Link href="/river" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">
              Open River →
            </Link>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {timelineEvents.slice(0, 8).map((ev, i) => (
              <div
                key={ev.id}
                className="flex shrink-0 flex-col items-center rounded-md border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.08)] px-3 py-2"
              >
                <span className="text-xs text-[var(--fg-muted)]">{i + 1}</span>
                <span className="mt-1 max-w-[80px] truncate text-xs text-[var(--fg-secondary)]">{ev.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-2 border-t border-[rgba(139,92,246,0.15)] pt-6">
        <Link href="/pulse" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Pulse</Link>
        <Link href="/signal" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Signal</Link>
        <Link href="/memories" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Memories</Link>
        <Link href="/graph" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Knowledge Graph</Link>
      </div>
    </div>
  );
}
