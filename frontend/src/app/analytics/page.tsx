"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPersonaMetrics, getAnalyticsInsights, type EventCount } from "@/lib/api";
import { DimensionHeader } from "@/components/nio/DimensionHeader";

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
      .then((d) => setProfile(d.cognitive_profile || {}))
      .catch(() => {});

    getAnalyticsInsights(insightsDays)
      .then((d) => setEventCounts(d.event_counts || []))
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, [insightsDays]);

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<><span className="gradient-text">Analytics</span> &amp; Voice Profile</>}
        subtitle="Cognitive profile derived from your writing patterns."
        stats={
          <Link href="/pressure-map" className="text-xs text-[rgba(139,92,246,0.9)] hover:underline">
            Pressure Map →
          </Link>
        }
      />

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-300">{error}</div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-nio-pulse rounded-lg bg-[rgba(139,92,246,0.08)]" />
          ))}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="cosmos-card rounded-xl p-6"
          >
            <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">Cognitive profile</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(profile).map(([key, val]) => (
                <div key={key} className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(19,16,28,0.6)] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--fg-primary)]">{String(val)}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="cosmos-card rounded-xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-label text-xs font-medium uppercase tracking-wide">Activity</h3>
              <select
                value={insightsDays}
                onChange={(e) => setInsightsDays(Number(e.target.value))}
                className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-3 py-1 text-xs text-[var(--fg-secondary)]"
              >
                {[7, 14, 30].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
            {eventCounts.length === 0 ? (
              <p className="text-sm text-[var(--fg-muted)]">No activity in this period.</p>
            ) : (
              <div className="space-y-2">
                {eventCounts.map((ec, i) => (
                  <motion.div
                    key={ec.date}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-lg border border-[rgba(139,92,246,0.15)] bg-[rgba(19,16,28,0.4)] px-3 py-2"
                  >
                    <span className="text-xs text-[var(--fg-muted)]">{formatDate(ec.date)}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                        <div
                          className="h-full rounded-full bg-[rgba(139,92,246,0.6)]"
                          style={{ width: `${Math.min(100, (Number(ec.count) / Math.max(...eventCounts.map((e) => Number(e.count)), 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--fg-secondary)]">{Number(ec.count)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
