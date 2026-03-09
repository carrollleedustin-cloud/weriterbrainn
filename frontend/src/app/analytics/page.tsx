"use client";

import { useState, useEffect } from "react";
import { getPersonaMetrics, getAnalyticsInsights, type EventCount } from "@/lib/api";

type CognitiveProfile = {
  tone?: string;
  sentence_length_avg?: number;
  vocab_diversity?: number;
  response_length_preference?: string;
  asks_questions_often?: boolean;
  expressive_punctuation?: boolean;
  sentiment_tendency?: string;
  [key: string]: unknown;
};

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<CognitiveProfile | Record<string, unknown>>({});
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [insightsDays, setInsightsDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPersonaMetrics()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAnalyticsInsights(insightsDays)
      .then((d) => setEventCounts(d.event_counts))
      .catch(() => setEventCounts([]));
  }, [insightsDays]);

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
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Tone</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)] capitalize">
            {typeof profile.tone === "string" ? profile.tone : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">formal / neutral / casual</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Avg. Sentence Length</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">
            {typeof profile.sentence_length_avg === "number"
              ? profile.sentence_length_avg.toFixed(1)
              : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">words per sentence</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Vocabulary Diversity</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">
            {typeof profile.vocab_diversity === "number"
              ? (profile.vocab_diversity * 100).toFixed(1)
              : "—"}
            %
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">unique words ratio</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Response Preference</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)] capitalize">
            {typeof profile.response_length_preference === "string"
              ? profile.response_length_preference
              : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-muted)]">brief / moderate / detailed</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Sentiment Tendency</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)] capitalize">
            {typeof profile.sentiment_tendency === "string"
              ? profile.sentiment_tendency
              : "—"}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Asks Questions</h3>
          <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)] capitalize">
            {typeof profile.asks_questions_often === "boolean"
              ? profile.asks_questions_often ? "Yes" : "No"
              : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-sm)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--fg-muted)]">Productivity Patterns</h3>
          <select
            value={insightsDays}
            onChange={(e) => setInsightsDays(parseInt(e.target.value, 10))}
            className="rounded border border-[rgba(139,92,246,0.3)] bg-[var(--bg-overlay)] px-2 py-1 text-sm text-[var(--fg-primary)]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
        <ProductivityChart eventCounts={eventCounts} />
      </div>

      {Object.keys(profile).length === 0 && !error && (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/70 p-8 text-center text-[var(--fg-muted)]">
          No profile yet. Use the Writing Studio or chat to build your cognitive profile.
        </div>
      )}
    </div>
  );
}

function ProductivityChart({ eventCounts }: { eventCounts: EventCount[] }) {
  const byDate = new Map<string, { accepted: number; regenerated: number; edited: number }>();
  for (const row of eventCounts) {
    const d = row.date;
    const cur = byDate.get(d) ?? { accepted: 0, regenerated: 0, edited: 0 };
    const c = parseInt(String(row.count), 10);
    if (row.event_type === "response_accepted") cur.accepted += c;
    else if (row.event_type === "response_regenerated") cur.regenerated += c;
    else if (row.event_type === "response_edited") cur.edited += c;
    byDate.set(d, cur);
  }
  const dates = Array.from(byDate.keys()).sort();
  const maxTotal = dates.length
    ? Math.max(
        ...dates.map((d) => {
          const v = byDate.get(d)!;
          return v.accepted + v.regenerated + v.edited;
        })
      )
    : 1;

  if (dates.length === 0) {
    return (
      <p className="text-sm text-[var(--fg-muted)]">
        No engagement data yet. Accept, regenerate, or edit chat responses to see patterns.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs text-[var(--fg-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded bg-[var(--success)]/70" /> Accepted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded bg-[var(--warning)]/70" /> Regenerated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded bg-[var(--accent)]/70" /> Edited
        </span>
      </div>
      <div className="flex items-end gap-1" style={{ minHeight: 120 }}>
      {dates.map((d) => {
        const v = byDate.get(d)!;
        return (
          <div
            key={d}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${formatDate(d)}: accepted ${v.accepted}, regenerated ${v.regenerated}, edited ${v.edited}`}
          >
            <div className="flex w-full flex-col-reverse gap-0.5" style={{ height: 100 }}>
              {v.accepted > 0 && (
                <div
                  className="w-full rounded-t bg-[var(--success)]/70 transition-all"
                  style={{ height: `${(v.accepted / maxTotal) * 100}%`, minHeight: v.accepted ? 4 : 0 }}
                />
              )}
              {v.regenerated > 0 && (
                <div
                  className="w-full rounded-t bg-[var(--warning)]/70 transition-all"
                  style={{ height: `${(v.regenerated / maxTotal) * 100}%`, minHeight: v.regenerated ? 4 : 0 }}
                />
              )}
              {v.edited > 0 && (
                <div
                  className="w-full rounded-t bg-[var(--accent)]/70 transition-all"
                  style={{ height: `${(v.edited / maxTotal) * 100}%`, minHeight: v.edited ? 4 : 0 }}
                />
              )}
            </div>
            <span className="truncate text-[10px] text-[var(--fg-muted)]">{formatDate(d)}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}
