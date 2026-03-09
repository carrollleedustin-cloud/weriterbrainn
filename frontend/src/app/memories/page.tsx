"use client";

import { useState } from "react";
import { searchMemories, createMemory } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

type SearchResult = {
  memory: { id: string; content: string; title?: string; memory_type: string; created_at: string };
  chunk_text: string;
  score: number;
};

export default function MemoriesPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"search" | "add" | "timeline">("search");
  const [newContent, setNewContent] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("note");
  const [submitted, setSubmitted] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await searchMemories(query.trim(), 15);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async () => {
    if (!newContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createMemory(newContent.trim(), newType, newTitle.trim() || undefined);
      setNewContent("");
      setNewTitle("");
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add memory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Memory Explorer</h1>
          <p className="text-sm text-[var(--fg-muted)]">Query, curate, and consolidate your memory vault.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("search")}
            variant={viewMode === "search" ? "secondary" : "ghost"}
          >
            Search
          </Button>
          <Button
            onClick={() => setViewMode("add")}
            variant={viewMode === "add" ? "secondary" : "ghost"}
          >
            Add Memory
          </Button>
          <Button
            onClick={() => setViewMode("timeline")}
            variant={viewMode === "timeline" ? "secondary" : "ghost"}
          >
            Timeline
          </Button>
        </div>
      </div>

      {viewMode === "search" && (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Semantic search..."
            />
            <Button onClick={search} disabled={loading} variant="secondary">
              Search
            </Button>
          </div>

          {error && (
            <div className="rounded-[var(--radius-md)] border border-red-500/40 bg-red-500/10 p-2 text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {loading && <p className="text-[var(--fg-muted)]">Searching...</p>}
            {!loading && results.length === 0 && query && (
              <p className="text-[var(--fg-muted)]">No memories found.</p>
            )}
            {results.map((r, i) => (
              <div
                key={`${r.memory.id}-${i}`}
                className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                  <span className="rounded bg-[var(--bg-overlay)] px-2 py-0.5">{r.memory.memory_type}</span>
                  {r.memory.title && <span>{r.memory.title}</span>}
                  <span>score: {r.score.toFixed(2)}</span>
                  <span>{new Date(r.memory.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[var(--fg-secondary)]">{r.chunk_text}</p>
                {r.chunk_text !== r.memory.content && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-[var(--fg-muted)]">Full content</summary>
                    <p className="mt-2 whitespace-pre-wrap text-[var(--fg-muted)]">{r.memory.content}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === "add" && (
        <div className="space-y-4">
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="rounded-[var(--radius-md)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-elevated)] px-4 py-2 text-[var(--fg-primary)]"
          >
            {["note", "idea", "document", "project", "belief", "goal"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Content..."
            rows={6}
          />
          <Button
            onClick={addMemory}
            disabled={loading || !newContent.trim()}
            variant="secondary"
          >
            {loading ? "..." : "Add Memory"}
          </Button>
          {submitted && <p className="text-emerald-300">Memory added and embedded.</p>}
          {error && (
            <div className="rounded-[var(--radius-md)] border border-red-500/40 bg-red-500/10 p-2 text-red-300">
              {error}
            </div>
          )}
        </div>
      )}

      {viewMode === "timeline" && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/70 p-6 text-[var(--fg-muted)]">
          Timeline view is coming next. Search or add memories to keep building your vault.
        </div>
      )}
    </div>
  );
}
