"use client";

import { useState, useEffect } from "react";
import { searchMemories, createMemory } from "@/lib/api";

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
  const [viewMode, setViewMode] = useState<"search" | "add">("search");
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
        <h1 className="text-2xl font-semibold text-zinc-50">Memory Explorer</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("search")}
            className={`rounded-lg px-3 py-1 text-sm ${viewMode === "search" ? "bg-zinc-700" : "bg-zinc-800"}`}
          >
            Search
          </button>
          <button
            onClick={() => setViewMode("add")}
            className={`rounded-lg px-3 py-1 text-sm ${viewMode === "add" ? "bg-zinc-700" : "bg-zinc-800"}`}
          >
            Add Memory
          </button>
        </div>
      </div>

      {viewMode === "search" && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Semantic search..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            <button
              onClick={search}
              disabled={loading}
              className="rounded-lg bg-zinc-700 px-4 py-2 hover:bg-zinc-600 disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
          )}

          <div className="space-y-4">
            {loading && <p className="text-zinc-500">Searching...</p>}
            {!loading && results.length === 0 && query && (
              <p className="text-zinc-500">No memories found.</p>
            )}
            {results.map((r, i) => (
              <div
                key={`${r.memory.id}-${i}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
                  <span className="rounded bg-zinc-800 px-2 py-0.5">{r.memory.memory_type}</span>
                  {r.memory.title && <span>{r.memory.title}</span>}
                  <span>score: {r.score.toFixed(2)}</span>
                  <span>{new Date(r.memory.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-zinc-300">{r.chunk_text}</p>
                {r.chunk_text !== r.memory.content && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-zinc-500">Full content</summary>
                    <p className="mt-2 whitespace-pre-wrap text-zinc-400">{r.memory.content}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {viewMode === "add" && (
        <div className="space-y-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100"
          >
            {["note", "idea", "document", "project", "belief", "goal"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Content..."
            rows={6}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            onClick={addMemory}
            disabled={loading || !newContent.trim()}
            className="rounded-lg bg-zinc-700 px-4 py-2 hover:bg-zinc-600 disabled:opacity-50"
          >
            {loading ? "..." : "Add Memory"}
          </button>
          {submitted && <p className="text-green-500">Memory added and embedded.</p>}
          {error && (
            <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
