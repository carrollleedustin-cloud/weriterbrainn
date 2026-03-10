"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SkeletonGraph } from "@/components/ui/Skeleton";
import type { NarrativeObject, NarrativeEdge } from "../types";
import { typeColor } from "../types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Props {
  objects: NarrativeObject[];
  edges: NarrativeEdge[];
  loading: boolean;
  authRequired: boolean;
  extractText: string;
  onExtractTextChange: (val: string) => void;
  extracting: boolean;
  onExtract: () => void;
}

export function UniverseTab({
  objects, edges, loading, authRequired,
  extractText, onExtractTextChange, extracting, onExtract,
}: Props) {
  const graphData = useMemo(() => ({
    nodes: objects.map((o) => ({ id: o.id, name: o.name, object_type: o.object_type, summary: o.summary })),
    links: edges.map((e) => ({ source: e.source_id, target: e.target_id, type: e.edge_type })),
  }), [objects, edges]);

  return (
    <>
      <div className="space-y-2">
        <label className="block text-sm text-[var(--fg-muted)]">Extract narrative elements from text</label>
        <div className="flex gap-2">
          <Textarea
            value={extractText}
            onChange={(e) => onExtractTextChange(e.target.value)}
            placeholder="Paste a scene, chapter, or passage. The system will extract characters, events, plot threads, canon facts, and relationships."
            rows={4}
            disabled={authRequired}
          />
          <Button onClick={onExtract} disabled={extracting || !extractText.trim() || authRequired} variant="secondary" className="self-end">
            {extracting ? "..." : "Extract"}
          </Button>
        </div>
      </div>

      <div className="cosmos-panel cosmos-graph-bg glow-border h-[520px] overflow-hidden rounded-xl">
        {loading ? (
          <SkeletonGraph />
        ) : authRequired ? (
          <div className="flex h-full items-center justify-center text-[var(--fg-muted)]">Sign in to view your story universe.</div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--fg-muted)]">
            <p>No narrative objects yet.</p>
            <p className="text-sm">Paste text above and click Extract to build your story universe.</p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(n: Record<string, unknown>) => {
              const name = (n.name as string) || "?";
              const type = (n.object_type as string) || "";
              const summary = (n.summary as string) || "";
              return `${name} [${type}]${summary ? ` — ${summary.slice(0, 80)}…` : ""}`;
            }}
            nodeColor={(n: Record<string, unknown>) => typeColor((n.object_type as string) || "")}
            linkColor={() => "rgba(139,92,246,0.4)"}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowColor={() => "rgba(139,92,246,0.6)"}
          />
        )}
      </div>

      {!authRequired && objects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["character", "event", "plot_thread"] as const).map((t) => (
            <div key={t} className="cosmos-card rounded-xl p-4">
              <h3 className="text-sm font-medium text-[var(--fg-muted)] capitalize">{t === "plot_thread" ? "Plot threads" : `${t}s`}</h3>
              <p className="text-2xl font-semibold text-[var(--fg-primary)]">{objects.filter((o) => o.object_type === t).length}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
