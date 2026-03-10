"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchMemories, createMemory, type MemorySearchResult as SearchResult } from "@/lib/api";
import { DimensionHeader } from "@/components/nio/DimensionHeader";

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
      setResults(data.results || []);
    } catch {
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const addMemory = async () => {
    if (!newContent.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createMemory(newContent, newType, newTitle || undefined);
      setSubmitted(true);
      setNewContent("");
      setNewTitle("");
    } catch {
      setError("Failed to save memory.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<><span className="gradient-text">Memory</span> Vault</>}
        subtitle="Semantic search over narrative memory. Store and retrieve knowledge fragments."
      />

      <div className="flex gap-2">
        {(["search", "add"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setViewMode(m); setSubmitted(false); }}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition ${
              viewMode === m
                ? "border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.2)] text-[var(--fg-primary)]"
                : "border-[rgba(139,92,246,0.25)] text-[var(--fg-muted)] hover:border-[rgba(139,92,246,0.4)]"
            }`}
          >
            {m === "search" ? "Search" : "Store memory"}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-300">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {viewMode === "search" ? (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Search narrative memory..."
                className="flex-1 rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-4 py-2.5 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
              />
              <button
                type="button"
                onClick={search}
                disabled={loading || !query.trim()}
                className="rounded-lg border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.15)] px-4 py-2 text-sm text-[var(--fg-primary)] transition hover:bg-[rgba(139,92,246,0.25)] disabled:opacity-40"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <motion.div
                    key={r.memory.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="cosmos-card rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {r.memory.title && <span className="text-sm font-medium text-[var(--fg-primary)]">{r.memory.title}</span>}
                        <span className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-[10px] uppercase text-[var(--fg-muted)]">{r.memory.memory_type}</span>
                      </div>
                      <span className="text-[10px] text-[var(--fg-muted)]">{Math.round(r.score * 100)}% match</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--fg-secondary)]">{r.chunk_text}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {results.length === 0 && !loading && query && (
              <p className="text-sm text-[var(--fg-muted)]">No memories matched.</p>
            )}
          </motion.div>
        ) : (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="cosmos-card rounded-xl p-6 space-y-4">
            {submitted ? (
              <div className="text-center py-8">
                <p className="text-sm text-emerald-400">Memory stored in the vault.</p>
                <button type="button" onClick={() => setSubmitted(false)} className="mt-3 text-xs text-[rgba(139,92,246,0.9)] hover:underline">Store another</button>
              </div>
            ) : (
              <>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-4 py-2 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
                />
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Memory content — lore, world-building notes, character details..."
                  className="h-32 w-full resize-none rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] p-4 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
                />
                <div className="flex items-center gap-3">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-3 py-1 text-xs text-[var(--fg-secondary)]"
                  >
                    {["note", "lore", "character", "world", "plot"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addMemory}
                    disabled={loading || !newContent.trim()}
                    className="rounded-lg border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.15)] px-4 py-2 text-sm text-[var(--fg-primary)] transition hover:bg-[rgba(139,92,246,0.25)] disabled:opacity-40"
                  >
                    {loading ? "Saving..." : "Store"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
