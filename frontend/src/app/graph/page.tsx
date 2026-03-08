"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { getGraphNodes, getGraphEdges, extractFromText } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type Node = { id: string; name: string; node_type: string };
type Edge = { id: string; source_id: string; target_id: string; relationship_type: string };

export default function GraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, e] = await Promise.all([getGraphNodes(), getGraphEdges()]);
      setNodes(n);
      setEdges(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    setExtracting(true);
    setError(null);
    try {
      await extractFromText(extractText.trim());
      setExtractText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const graphData = {
    nodes: nodes.map((n) => ({ id: n.id, name: n.name, node_type: n.node_type })),
    links: edges.map((e) => ({
      source: e.source_id,
      target: e.target_id,
      type: e.relationship_type,
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Knowledge Graph</h1>
          <p className="text-sm text-[var(--fg-muted)]">Explore entities, relationships, and timelines.</p>
        </div>
        <div className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          Relational Atlas
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-[var(--fg-muted)]">Extract entities from text</label>
        <div className="flex gap-2">
          <Textarea
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            placeholder="Paste text to extract people, concepts, projects, relationships..."
            rows={3}
          />
          <Button
            onClick={handleExtract}
            disabled={extracting || !extractText.trim()}
            variant="secondary"
            className="self-end"
          >
            {extracting ? "..." : "Extract"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-red-300">
          {error}
        </div>
      )}

      <div className="h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(180deg,rgba(20,16,32,0.9),rgba(10,8,18,0.95))] shadow-[var(--shadow-md)]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-[var(--fg-muted)]">
            Loading graph...
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[var(--fg-muted)]">
            No nodes yet. Add text above to extract entities.
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(n: Record<string, unknown>) => {
              const t = n.node_type as string | undefined;
              return t === "person"
                ? "#22c55e"
                : t === "project"
                ? "#8b5cf6"
                : "#c084fc";
            }}
            linkColor={() => "rgba(139,92,246,0.35)"}
          />
        )}
      </div>
    </div>
  );
}
