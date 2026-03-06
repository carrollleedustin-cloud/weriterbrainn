"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { getGraphNodes, getGraphEdges, extractFromText } from "@/lib/api";

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
      <h1 className="text-2xl font-semibold text-zinc-50">Knowledge Graph</h1>

      <div className="space-y-2">
        <label className="block text-sm text-zinc-400">Extract entities from text</label>
        <div className="flex gap-2">
          <textarea
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            placeholder="Paste text to extract people, concepts, projects, relationships..."
            rows={3}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !extractText.trim()}
            className="self-end rounded-lg bg-zinc-700 px-4 py-2 hover:bg-zinc-600 disabled:opacity-50"
          >
            {extracting ? "..." : "Extract"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
      )}

      <div className="h-[500px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        {loading ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Loading graph...
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No nodes yet. Add text above to extract entities.
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(n: Record<string, unknown>) => {
              const t = n.node_type as string | undefined;
              return t === "person" ? "#22c55e" : t === "project" ? "#3b82f6" : "#a855f7";
            }}
            linkColor={() => "#52525b"}
          />
        )}
      </div>
    </div>
  );
}
