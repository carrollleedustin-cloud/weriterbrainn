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
        <h1 className="text-2xl font-semibold text-zinc-50">Analytics Dashboard</h1>
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-50">Analytics Dashboard</h1>
      <p className="text-zinc-400">
        Insights into your thinking patterns. Record writing samples in the Writing Assistant to build persona metrics.
      </p>

      {error && (
        <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-sm font-medium text-zinc-500">Avg. Sentence Length</h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {metrics.avg_sentence_length != null
              ? metrics.avg_sentence_length.toFixed(1)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">words per sentence</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-sm font-medium text-zinc-500">Vocabulary Complexity</h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {metrics.vocab_complexity != null
              ? (metrics.vocab_complexity * 100).toFixed(1)
              : "—"}
            %
          </p>
          <p className="mt-1 text-xs text-zinc-500">unique words ratio</p>
        </div>
      </div>

      {Object.keys(metrics).length === 0 && !error && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No metrics yet. Use the Writing Assistant to record samples.
        </div>
      )}
    </div>
  );
}
