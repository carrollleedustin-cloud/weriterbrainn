"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { getGraphNodes, getGraphEdges, extractFromText, searchGraphEntities } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import type { ForceGraphMethods } from "react-force-graph-2d";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

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
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      node_type: n.node_type,
      highlighted: highlightNodeId === n.id,
    })),
    links: edges.map((e) => ({
      source: e.source_id,
      target: e.target_id,
      type: e.relationship_type,
    })),
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const results = await searchGraphEntities(searchQuery.trim(), 5);
      const first = results[0] as { id: string } | undefined;
      setHighlightNodeId(first?.id ?? null);
    } catch {
      setHighlightNodeId(null);
    }
  }, [searchQuery]);

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

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="block text-sm text-[var(--fg-muted)]">Search & highlight</label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search entities..."
            />
            <Button onClick={handleSearch} variant="secondary" disabled={loading || !searchQuery.trim()}>
              Go
            </Button>
          </div>
        </div>
        <div className="flex gap-2 self-end">
          <Button variant="ghost" className="px-2 py-1" onClick={() => graphRef.current?.zoom((graphRef.current?.zoom() ?? 1) * 1.3, 200)} title="Zoom in">
            +
          </Button>
          <Button variant="ghost" className="px-2 py-1" onClick={() => graphRef.current?.zoom((graphRef.current?.zoom() ?? 1) / 1.3, 200)} title="Zoom out">
            −
          </Button>
          <Button variant="ghost" className="px-2 py-1" onClick={() => graphRef.current?.zoomToFit(300, 40)} title="Fit to view">
            Fit
          </Button>
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
            ref={graphRef}
            graphData={graphData}
            nodeLabel={(n: Record<string, unknown>) => {
              const name = (n.name as string) || "?";
              const type = (n.node_type as string) || "";
              return `${name} [${type}]`;
            }}
            nodeColor={(n: Record<string, unknown>) => {
              const t = (n.node_type as string) || "";
              const highlighted = n.highlighted === true;
              if (highlighted) return "#fbbf24";
              return t === "person" ? "#22c55e" : t === "project" ? "#8b5cf6" : "#c084fc";
            }}
            linkColor={() => "rgba(139,92,246,0.35)"}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowColor={() => "rgba(139,92,246,0.5)"}
            minZoom={0.1}
            maxZoom={20}
            onNodeClick={(n: Record<string, unknown>) => {
              const id = n.id as string;
              setHighlightNodeId((prev) => (prev === id ? null : id));
            }}
          />
        )}
      </div>
    </div>
  );
}
