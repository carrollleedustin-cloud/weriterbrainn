"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getPersonaMetrics, getAnalyticsInsights, type EventCount } from "@/lib/api";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import { PressureHUD } from "@/components/nio/PressureHUD";
import { StyleDNAMatrix } from "@/components/nio/StyleDNAMatrix";
import { TensionVeins } from "@/components/nio/TensionVeins";

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

type Severity = "low" | "medium" | "high" | "critical";
function toSeverity(value: number, medium: number, high: number): Severity {
  if (value >= high) return "high";
  if (value >= medium) return "medium";
  return "low";
}

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<CognitiveProfile | Record<string, unknown>>({});
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [insightsDays, setInsightsDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const activityPeak = useMemo(() => Math.max(...eventCounts.map((e) => Number(e.count) || 0), 1), [eventCounts]);
  const spectralGrid = useMemo(() => {
    const grid: number[] = [];
    const counts = eventCounts.map((e) => Number(e.count) || 0);
    const max = Math.max(...counts, 1);
    for (let i = 0; i < 21; i += 1) {
      const v = counts[i] ?? (counts[i % counts.length] ?? 0);
      grid.push(Math.min(1, v / max));
    }
    return grid;
  }, [eventCounts]);

  const styleDNAData = useMemo(() => {
    const base = {
      sentenceRhythm: profile.sentence_length_avg ? Math.min(1, Number(profile.sentence_length_avg) / 28) : 0.6,
      vocabDiversity: profile.vocab_diversity ? Number(profile.vocab_diversity) : 0.55,
      tonalGravity: profile.tone ? 0.72 : 0.58,
      expressivePunctuation: profile.expressive_punctuation ? 0.7 : 0.45,
      questions: profile.asks_questions_often ? 0.62 : 0.32,
      sentimentBias: (profile.sentiment_tendency as string | undefined) || "balanced",
      responsePreference: (profile.response_length_preference as string | undefined) || "varies",
    };
    return base;
  }, [profile]);

  const pressureMetrics = useMemo(() => {
    const activity = Math.round((activityPeak / 50) * 100);
    const lexical = Math.round((Number(profile.vocab_diversity) || 0.55) * 100);
    const emotional = profile.sentiment_tendency === "negative" ? 62 : profile.sentiment_tendency === "positive" ? 44 : 53;
    return [
      { id: "activity", label: "Activity flux", value: activity, max: 140, severity: toSeverity(activity, 80, 110) },
      { id: "lexical", label: "Lexical spread", value: lexical, max: 100, severity: toSeverity(lexical, 60, 85) },
      { id: "emotion", label: "Emotional drift", value: emotional, max: 100, severity: toSeverity(emotional, 55, 72) },
      { id: "instability", label: "Instability echo", value: 38, max: 100, severity: "low" as Severity },
    ];
  }, [activityPeak, profile]);

  const veinNodes = useMemo(
    () =>
      eventCounts.slice(0, 6).map((e, i) => ({
        id: e.date,
        label: e.date,
        heat: Math.min(1, (Number(e.count) || 0) / activityPeak),
        x: 20 + i * 30,
        y: 20 + Math.sin(i * 0.8) * 18 + 40,
      })),
    [eventCounts, activityPeak]
  );

  useEffect(() => {
    setLoading(true);
    setErrors([]);

    const loadProfile = getPersonaMetrics()
      .then((d) => setProfile(d.cognitive_profile || {}))
      .catch(() => "Could not load persona profile.");

    const loadInsights = getAnalyticsInsights(insightsDays)
      .then((d) => setEventCounts(d.event_counts || []))
      .catch(() => "Could not load activity insights.");

    Promise.all([loadProfile, loadInsights]).then((results) => {
      const failed = results.filter((r): r is string => typeof r === "string");
      setErrors(failed);
      setLoading(false);
    });
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

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((msg, i) => (
            <div key={i} className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-300">{msg}</div>
          ))}
        </div>
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
            className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div className="cosmos-card relative overflow-hidden rounded-xl p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.16),transparent_45%),radial-gradient(circle_at_75%_40%,rgba(34,197,94,0.12),transparent_45%)] opacity-80" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-label text-xs font-medium uppercase tracking-wide">Pressure HUD — Telemetry</h3>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[rgba(255,255,255,0.55)]">Live simulation</span>
                </div>
                <PressureHUD metrics={pressureMetrics} />
                <p className="text-xs text-[var(--fg-muted)]">
                  Flux derived from your recent narrative actions. Instability echoes show latent fracture risk.
                </p>
              </div>
            </div>

            <div className="cosmos-card relative overflow-hidden rounded-xl p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.16),transparent_55%)] opacity-70" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-label text-xs font-medium uppercase tracking-wide">Style DNA Matrix</h3>
                  <span className="rounded-full border border-[rgba(139,92,246,0.35)] px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[rgba(255,255,255,0.7)]">
                    Living Helix
                  </span>
                </div>
                <StyleDNAMatrix data={styleDNAData} />
              </div>
            </div>
          </motion.div>

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
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
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
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                          <div
                            className="h-full rounded-full bg-[rgba(139,92,246,0.6)]"
                            style={{ width: `${Math.min(100, (Number(ec.count) / activityPeak) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--fg-secondary)]">{Number(ec.count)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase tracking-[0.35em] text-[var(--fg-muted)]">Tension veins</h4>
                  <TensionVeins nodes={veinNodes} />
                  <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(12,10,20,0.7)] p-3">
                    <p className="text-xs text-[var(--fg-secondary)]">
                      Veins glow where activity concentrates. Heavier nodes indicate narrative heat; gaps signal dead air.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="cosmos-card overflow-hidden rounded-xl p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-label text-xs font-medium uppercase tracking-wide">Echo heatmap</h3>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[rgba(255,255,255,0.6)]">Discovery order vs memory order</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {spectralGrid.map((v, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border border-[rgba(139,92,246,0.15)]"
                  style={{
                    background: `linear-gradient(135deg, rgba(139,92,246,${0.2 + v * 0.5}), rgba(236,72,153,${0.12 + v * 0.35}))`,
                    boxShadow: v > 0.6 ? "0 0 16px rgba(139,92,246,0.2)" : undefined,
                  }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--fg-muted)]">
              High-energy cells mark repeated echoes and callbacks; cold cells show untouched narrative space.
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
