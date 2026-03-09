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
      ]).then(([objs, edgs, th, , tl, chars]) => {
        setObjects(objs);
        setEdges(edgs);
        setThreads(th.threads || []);
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
      <div className="flex min-h-[640px] flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Skeleton className="h-[520px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const hasStory = objects.length > 0 || threads.length > 0 || timelineEvents.length > 0 || characters.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.1)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--fg-secondary)]">
            Narrative Intelligence OS
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--fg-primary)] sm:text-5xl">
            Enter the <span className="gradient-text">Story Cosmos</span>
          </h1>
          <p className="max-w-2xl text-sm text-[var(--fg-muted)]">
            Stories are living systems of gravity, memory, tension, and evolution. Navigate them through spatial exploration —
            zoom, pan, dive, orbit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/universe"
            className="btn-cosmos rounded-full px-5 py-2 text-sm text-[var(--fg-secondary)]"
          >
            Open Story Cosmos
          </Link>
          <Link
            href="/chat"
            className="rounded-full bg-[linear-gradient(135deg,rgba(139,92,246,0.35),rgba(139,92,246,0.2))] px-5 py-2 text-sm font-medium text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition hover:shadow-[0_0_28px_rgba(139,92,246,0.4)]"
          >
            Invoke Oracle
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="cosmos-panel cosmos-graph-bg relative min-h-[520px] overflow-hidden rounded-[var(--radius-lg)] glow-border" role="region" aria-label="Story Cosmos">
          <div className="absolute inset-0">
            <div className="cosmos-constellation" />
            <div className="cosmos-orbit orbit-1" />
            <div className="cosmos-orbit orbit-2" />
            <div className="cosmos-river" />
            <div className="cosmos-loom" />
          </div>
          {!hasStory ? (
            <div className="relative z-10 flex h-[520px] flex-col items-center justify-center gap-4 text-center">
              <p className="text-[var(--fg-muted)]">Your cosmos is dormant.</p>
              <p className="max-w-sm text-sm text-[var(--fg-muted)]">
                Begin by extracting narrative text to seed characters, events, and constellations.
              </p>
              <Link
                href="/universe"
                className="rounded-full bg-[rgba(139,92,246,0.2)] px-4 py-2 text-sm text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.3)]"
              >
                Seed the Cosmos
              </Link>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="relative z-10 flex h-[520px] flex-col items-center justify-center gap-2 text-[var(--fg-muted)]">
              <p>No celestial objects yet — extract text to populate the cosmos.</p>
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
                <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg cosmos-card border-[rgba(139,92,246,0.4)] p-4 shadow-xl backdrop-blur-md">
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
                      <Link href={`/cast?c=${selectedNode.id}`} className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Mindspace →</Link>
                    ) : null}
                    <Link href="/universe" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">Cosmos →</Link>
                  </div>
                </div>
              )}
            </>
          )}
          <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.6)]">
            <span className="cosmos-chip">Zoom</span>
            <span className="cosmos-chip">Pan</span>
            <span className="cosmos-chip">Dive</span>
            <span className="cosmos-chip">Orbit</span>
          </div>
          <div className="absolute right-6 top-6 z-10 flex flex-col gap-2">
            <div className="cosmos-meter">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">Narrative Energy</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(139,92,246,0.12)]">
                <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#8b5cf6,#c084fc,#f0abfc)]" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-[var(--fg-muted)]">
                <span>Intense</span>
                <span>72%</span>
              </div>
            </div>
            <div className="cosmos-meter">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">Creative Pulse</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <span className="text-xs text-[var(--fg-secondary)]">Flowing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="cosmos-card rounded-lg p-4">
            <h3 className="section-label text-xs font-medium uppercase tracking-wide">Narrative Gravity</h3>
            <p className="mt-2 text-sm text-[var(--fg-secondary)]">
              Major characters bend the story field. Plot threads form arcs of influence.
            </p>
            <div className="mt-3 space-y-2 text-xs text-[var(--fg-muted)]">
              <div className="flex items-center justify-between">
                <span>Character Wells</span>
                <span className="text-emerald-400">{Math.max(2, characters.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Event Bursts</span>
                <span className="text-amber-400">{Math.max(4, timelineEvents.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Thread Arcs</span>
                <span className="text-violet-300">{Math.max(3, threads.length)}</span>
              </div>
            </div>
          </div>

          <div className="cosmos-card rounded-lg p-4">
            <h3 className="section-label text-xs font-medium uppercase tracking-wide">Oracle Layer</h3>
            <p className="mt-2 text-sm text-[var(--fg-secondary)]">
              Ask the Oracle. It simulates psychology, memory, and goals to surface probable outcomes.
            </p>
            <div className="oracle-prompt mt-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)]">Oracle Query</p>
              <p className="mt-1 text-sm text-[var(--fg-primary)]">“What would Marcus do if the river fractures?”</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                <span>Simulating narrative outcomes...</span>
              </div>
            </div>
          </div>

          <div className="cosmos-card rounded-lg p-4">
            <h3 className="section-label text-xs font-medium uppercase tracking-wide">Story Echoes</h3>
            <ul className="mt-2 space-y-2 text-xs text-[var(--fg-secondary)]">
              <li className="echo-item">Echo: “Betrayal in Act I” ↔ “Silent vow in Act III”</li>
              <li className="echo-item">Echo: “Storm Gate collapse” ↔ “River betrayal ripple”</li>
              <li className="echo-item">Echo: “Constellation oath” ↔ “Final tribunal”</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="cosmos-card rounded-lg p-5">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Temporal River Engine</h3>
          <div className="river-band mt-4">
            {(timelineEvents.length ? timelineEvents : new Array(6).fill(null)).slice(0, 6).map((ev, i) => (
              <div key={ev?.id ?? i} className="river-stone">
                <span className="text-[10px] text-[var(--fg-muted)]">{i + 1}</span>
                <span className="text-xs text-[var(--fg-secondary)]">{ev?.name ?? `Scene ${i + 1}`}</span>
              </div>
            ))}
            <div className="river-ripple" />
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Events create ripples of causality downstream. Currents reveal plot momentum.
          </p>
        </div>

        <div className="cosmos-card rounded-lg p-5">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Plot Loom Field</h3>
          <div className="loom-field mt-4">
            {(threads.length ? threads : new Array(5).fill(null)).slice(0, 5).map((t, i) => (
              <div key={t?.id ?? i} className={`loom-thread ${i % 3 === 0 ? "loom-rise" : i % 3 === 1 ? "loom-dormant" : "loom-resolve"}`}>
                <span className="text-xs text-[var(--fg-secondary)]">{t?.name ?? `Thread ${i + 1}`}</span>
              </div>
            ))}
            <div className="loom-knot">Knot</div>
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Tension glows across threads. Intersections form narrative knots.
          </p>
        </div>

        <div className="cosmos-card rounded-lg p-5">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Character Mindspace</h3>
          <div className="mindspace mt-4">
            <div className="mind-node">Desire</div>
            <div className="mind-node">Fear</div>
            <div className="mind-node">Secret</div>
            <div className="mind-node">Loyalty</div>
            <div className="mind-link" />
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Psychological nodes map motive, conflict, and hidden connections.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="cosmos-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <h3 className="section-label text-xs font-medium uppercase tracking-wide">Living Writing Surface</h3>
            <span className="text-xs text-[var(--fg-muted)]">Flow Mode</span>
          </div>
          <div className="writing-surface mt-4">
            <p>
              The <span className="concept-glow">river</span> hums as Marcus steps into the storm. The
              <span className="concept-glow">constellation oath</span> tightens, and the
              <span className="concept-glow">betrayal</span> signal pulses downstream.
            </p>
            <div className="writing-signals">
              <span className="signal-pill">Character Presence: Marcus + Ilyra</span>
              <span className="signal-pill">Continuity Risk: LOW</span>
              <span className="signal-pill">Style DNA: 92% match</span>
              <span className="signal-pill">Plot Thread: Storm Gate</span>
            </div>
          </div>
        </div>
        <div className="cosmos-card rounded-lg p-6">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Style DNA Lab</h3>
          <div className="dna-helix mt-4">
            <div className="dna-strand" />
            <div className="dna-strand" />
            <div className="dna-rung" />
            <div className="dna-rung" />
            <div className="dna-rung" />
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Sentence rhythm, tone distribution, and dialogue signature converge into a living helix.
          </p>
          <div className="mt-4 text-xs text-[var(--fg-secondary)]">
            AI alignment: <span className="text-emerald-400">Synced</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="cosmos-card rounded-lg p-6">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Narrative Heatmap</h3>
          <div className="heatmap mt-4">
            {new Array(28).fill(null).map((_, i) => (
              <span key={i} className={`heat-cell heat-${(i % 7) + 1}`} />
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--fg-muted)]">Visualize emotional intensity across the entire story.</p>
        </div>
        <div className="cosmos-card rounded-lg p-6">
          <h3 className="section-label text-xs font-medium uppercase tracking-wide">Story Drift + Resonance</h3>
          <div className="mt-4 space-y-3 text-sm text-[var(--fg-secondary)]">
            <div className="drift-row">
              <span>Story Drift</span>
              <span className="text-amber-300">Minor</span>
            </div>
            <div className="drift-row">
              <span>Plot Resonance</span>
              <span className="text-emerald-400">High</span>
            </div>
            <div className="drift-row">
              <span>Narrative Storms</span>
              <span className="text-violet-300">2 Active</span>
            </div>
          </div>
          <div className="storm-cluster mt-4">
            <div className="storm-node" />
            <div className="storm-node" />
            <div className="storm-node" />
          </div>
        </div>
      </div>
    </div>
  );
}
