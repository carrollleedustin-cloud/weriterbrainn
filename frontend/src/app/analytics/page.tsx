"use client";

import { useState, useEffect } from "react";
import { getPersonaMetrics } from "@/lib/api";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPersonaMetrics()
      .then(setMetrics)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Cognitive Insights</h1>
        <p className="text-[var(--fg-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Cognitive Insights</h1>
          <p className="text-[var(--fg-secondary)]">
            Trends and persona signals extracted from your writing.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          Signal Deck
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Avg. Sentence Length</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">
            {metrics.avg_sentence_length != null
              ? metrics.avg_sentence_length.toFixed(1)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">words per sentence</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Vocabulary Complexity</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">
            {metrics.vocab_complexity != null
              ? (metrics.vocab_complexity * 100).toFixed(1)
              : "—"}
            %
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">unique words ratio</p>
        </div>
      </div>

      {Object.keys(metrics).length === 0 && !error && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/70 p-8 text-center text-[var(--fg-muted)]">
          No metrics yet. Use the Writing Studio to record samples.
        </div>
      )}
    </div>
  );
}
