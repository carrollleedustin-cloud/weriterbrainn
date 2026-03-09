"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  narrativeExtract,
  narrativeCompile,
  narrativePreview,
  narrativeAsk,
  getNarrativeObjects,
  getNarrativeEdges,
  getNarrativeTimeline,
  getNarrativePlotThreads,
  getNarrativeStrategy,
  getCanonFacts,
  getMe,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SkeletonGraph } from "@/components/ui/Skeleton";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

type Tab = "universe" | "compile" | "timeline" | "threads" | "strategy" | "canon" | "qa";
type NarrativeObject = {
  id: string;
  object_type: string;
  name: string;
  summary?: string;
  canon_state: string;
  created_at: string;
};

type NarrativeEdge = {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: string;
};

type CompileIssue = {
  issue_id?: string;
  category?: string;
  severity?: string;
  summary: string;
  confidence?: number;
  affected_entities?: string[];
  evidence?: string;
  source_passage?: string;
  related_canon?: string;
  suggested_resolution?: string;
};

type CompileResult = {
  alerts?: Array<{ tier: string; summary: string; confidence?: number; source_passage?: string; related_canon?: string; suggested_resolution?: string }>;
  issues?: CompileIssue[];
  overall_tier: string;
  overall_severity?: string;
  explanation_path?: { stages_run?: string[]; canon_facts_used?: unknown[]; issue_count?: number };
};

type TimelineEvent = {
  id: string;
  name: string;
  summary?: string;
  temporal?: unknown;
  caused_by: Array<{ event_id: string; name: string }>;
};

type PlotThread = {
  id: string;
  name: string;
  summary?: string;
  status: string;
  related_events: string[];
};

type StrategyResult = {
  summary: string;
  suggestions: Array<{ title: string; description: string; priority?: string }>;
  opportunities: Array<{ title: string; description: string }>;
};

type QAResult = {
  answer: string;
  citations: Array<{ type: string; name: string; excerpt: string }>;
  confidence: number;
  reasoning_summary?: string;
  related_entities?: Array<{ name: string; role: string }>;
  ambiguity_notes?: string[];
  contradictory_evidence?: string[];
};

function UniverseContent() {
  const [objects, setObjects] = useState<NarrativeObject[]>([]);
  const [edges, setEdges] = useState<NarrativeEdge[]>([]);
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [compileText, setCompileText] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    impacts?: Array<{ type: string; target: string; description: string; severity: string }>;
    impacted_canon_facts?: Array<{ fact_value: string; impact: string }>;
    impacted_threads?: Array<{ name: string; impact: string }>;
    impacted_characters?: Array<{ name: string; impact: string }>;
    blast_radius?: { scene?: number; chapter?: number; book?: number; universe?: number };
    risk_score?: number;
    opportunity_score?: number;
    summary: string;
    delta_summary?: string;
    compile_alerts?: unknown[];
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([]);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [canonFacts, setCanonFacts] = useState<Array<{ id: string; fact_value: string; fact_type: string; confidence: number; canon_state: string; source_passage?: string }>>([]);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const validTabs: Tab[] = ["universe", "compile", "timeline", "threads", "strategy", "canon", "qa"];
  const [tab, setTab] = useState<Tab>(
    tabFromUrl && validTabs.includes(tabFromUrl as Tab) ? (tabFromUrl as Tab) : "universe"
  );

  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl as Tab)) {
      setTab(tabFromUrl as Tab);
    }
  }, [tabFromUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      if (!me) {
        setAuthRequired(true);
        setObjects([]);
        setEdges([]);
        setTimelineEvents([]);
        setPlotThreads([]);
        return;
      }
      const [objs, edgs, tl, threads] = await Promise.all([
        getNarrativeObjects(),
        getNarrativeEdges(),
        getNarrativeTimeline().catch(() => ({ events: [] })),
        getNarrativePlotThreads().catch(() => ({ threads: [] })),
      ]);
      setObjects(objs);
      setEdges(edgs);
      setTimelineEvents(tl.events || []);
      setPlotThreads(threads.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setObjects([]);
      setEdges([]);
      setTimelineEvents([]);
      setPlotThreads([]);
      if (err instanceof Error && err.message.includes("401")) {
        setAuthRequired(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "strategy" && !authRequired && objects.length > 0) {
      getNarrativeStrategy().then(setStrategy).catch(() => setStrategy(null));
    }
  }, [tab, authRequired, objects.length]);

  useEffect(() => {
    if (tab === "canon" && !authRequired) {
      getCanonFacts().then((r) => setCanonFacts(r.facts || [])).catch(() => setCanonFacts([]));
    }
  }, [tab, authRequired]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    setExtracting(true);
    setError(null);
    setSuccess(null);
    try {
      await narrativeExtract(extractText.trim());
      setExtractText("");
      setSuccess("Extraction complete — universe updated.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Extraction failed"
      );
      if (err instanceof Error && err.message.includes("401")) {
        setAuthRequired(true);
      }
    } finally {
      setExtracting(false);
    }
  };

  const handlePreview = async () => {
    if (!compileText.trim()) return;
    setPreviewing(true);
    setError(null);
    try {
      const result = await narrativePreview(compileText.trim());
      setPreviewResult(result);
      if ((result.compile_alerts?.length || result.compile_issues?.length) && !compileResult) {
        setCompileResult({
          alerts: result.compile_alerts,
          issues: result.compile_issues,
          overall_tier: "ok",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setPreviewResult(null);
    } finally {
      setPreviewing(false);
    }
  };

  const handleCompile = async () => {
    if (!compileText.trim()) return;
    setCompiling(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await narrativeCompile(compileText.trim());
      setCompileResult(result);
      setSuccess(result.overall_tier === "ok" ? "Compile passed — no issues." : "Compile complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compile failed");
      setCompileResult(null);
    } finally {
      setCompiling(false);
    }
  };

  const handleLoadStrategy = async () => {
    setError(null);
    try {
      const result = await getNarrativeStrategy();
      setStrategy(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Strategy load failed");
      setStrategy(null);
    }
  };

  const handleAsk = async () => {
    if (!qaQuestion.trim()) return;
    setQaLoading(true);
    setError(null);
    try {
      const result = await narrativeAsk(qaQuestion.trim());
      setQaResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Q&A failed");
      setQaResult(null);
    } finally {
      setQaLoading(false);
    }
  };

  const graphData = useMemo(() => ({
    nodes: objects.map((o) => ({
      id: o.id,
      name: o.name,
      object_type: o.object_type,
      summary: o.summary,
    })),
    links: edges.map((e) => ({
      source: e.source_id,
      target: e.target_id,
      type: e.edge_type,
    })),
  }), [objects, edges]);

  const typeColor = (t: string) => {
    switch (t) {
      case "character":
        return "#22c55e";
      case "event":
        return "#f59e0b";
      case "location":
        return "#3b82f6";
      case "plot_thread":
        return "#a855f7";
      case "secret":
        return "#ef4444";
      default:
        return "#c084fc";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">
            Story Universe
          </h1>
          <p className="text-sm text-[var(--fg-muted)]">
            Narrative Intelligence — characters, events, plot threads, canon.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          NIOS
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[rgba(139,92,246,0.2)] pb-2">
        {(["universe", "compile", "timeline", "threads", "strategy", "canon", "qa"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              tab === t
                ? "bg-[rgba(139,92,246,0.25)] text-[var(--fg-primary)]"
                : "text-[var(--fg-muted)] hover:bg-[rgba(139,92,246,0.1)]"
            }`}
          >
            {t === "qa" ? "Story Q&A" : t === "canon" ? "Canon" : t}
          </button>
        ))}
      </nav>

      {authRequired && (
        <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to use the Story Universe. Narrative extraction and the universe
          model require authentication.
        </div>
      )}

      {tab === "universe" && (
      <div className="space-y-2">
        <label className="block text-sm text-[var(--fg-muted)]">
          Extract narrative elements from text
        </label>
        <div className="flex gap-2">
          <Textarea
            value={extractText}
            onChange={(e) => setExtractText(e.target.value)}
            placeholder="Paste a scene, chapter, or passage. The system will extract characters, events, plot threads, canon facts, and relationships."
            rows={4}
            disabled={authRequired}
          />
          <Button
            onClick={handleExtract}
            disabled={extracting || !extractText.trim() || authRequired}
            variant="secondary"
            className="self-end"
          >
            {extracting ? "..." : "Extract"}
          </Button>
        </div>
      </div>
      )}

      {tab === "compile" && (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--fg-muted)] mb-2">
            Validate new text against canon (Continuity Guardian)
          </label>
          <div className="flex gap-2">
            <Textarea
              value={compileText}
              onChange={(e) => setCompileText(e.target.value)}
              placeholder="Paste new draft text. The compiler will check for continuity issues: dead characters, timeline breaks, lore violations, knowledge leaks."
              rows={4}
              disabled={authRequired}
            />
            <div className="flex flex-col gap-1 self-end">
              <Button
                onClick={handleCompile}
                disabled={compiling || !compileText.trim() || authRequired}
                variant="secondary"
              >
                {compiling ? "Checking..." : "Compile"}
              </Button>
              <Button
                onClick={handlePreview}
                disabled={previewing || !compileText.trim() || authRequired}
                variant="secondary"
                className="text-xs"
              >
                {previewing ? "Previewing..." : "Consequence Preview"}
              </Button>
            </div>
          </div>
        </div>
        {compileResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className={`text-sm font-medium ${
                compileResult.overall_tier === "canon_break" ? "text-red-400" :
                compileResult.overall_tier === "likely_contradiction" ? "text-amber-400" :
                compileResult.overall_tier === "soft_risk" ? "text-yellow-400" : "text-emerald-400"
              }`}>
                Overall: {compileResult.overall_severity ?? compileResult.overall_tier}
              </p>
              {compileResult.explanation_path?.issue_count !== undefined && (
                <span className="text-xs text-[var(--fg-muted)]">
                  {compileResult.explanation_path.issue_count} issue(s) · stages: {compileResult.explanation_path.stages_run?.join(" → ")}
                </span>
              )}
            </div>
            {((compileResult.issues && compileResult.issues.length > 0) || (compileResult.alerts && compileResult.alerts.length > 0)) ? (
              <ul className="space-y-2">
                {(compileResult.issues ?? compileResult.alerts ?? []).map((item, i) => {
                  const iss = item as CompileIssue & { tier?: string; related_canon?: string; suggested_resolution?: string };
                  const severity = "severity" in item ? (item as { severity?: string }).severity : null;
                  const tier = "tier" in item ? (item as { tier?: string }).tier : null;
                  const category = "category" in item ? (item as { category?: string }).category : null;
                  const isCritical = severity === "critical" || tier === "canon_break";
                  const isHigh = severity === "high" || tier === "likely_contradiction";
                  return (
                    <li key={i} className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-[var(--fg-secondary)]"}`}>
                          {category ?? tier ?? "issue"}
                        </span>
                        {severity && (
                          <span className="rounded bg-[rgba(139,92,246,0.15)] px-1.5 py-0.5 text-xs">{severity}</span>
                        )}
                      </div>
                      <p className="text-[var(--fg-primary)] mt-1">{iss.summary}</p>
                      {iss.related_canon && <p className="text-[var(--fg-muted)] mt-1">Canon: {iss.related_canon}</p>}
                      {iss.suggested_resolution && <p className="text-emerald-400/90 mt-1">Fix: {iss.suggested_resolution}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[var(--fg-muted)]">No continuity issues detected.</p>
            )}
            {previewResult && (
              <div className="mt-4 space-y-4 border-t border-[rgba(139,92,246,0.2)] pt-4">
                <div>
                  <p className="text-sm font-medium text-[var(--fg-muted)]">Consequence Preview V2</p>
                  <p className="text-sm text-[var(--fg-secondary)] mt-1">{previewResult.summary}</p>
                  {previewResult.delta_summary && (
                    <p className="text-xs text-[var(--fg-muted)] mt-1">{previewResult.delta_summary}</p>
                  )}
                </div>
                {(previewResult.risk_score !== undefined || previewResult.opportunity_score !== undefined) && (
                  <div className="flex gap-4">
                    <div className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm">
                      Risk: {((previewResult.risk_score ?? 0) * 100).toFixed(0)}%
                    </div>
                    <div className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm">
                      Opportunity: {((previewResult.opportunity_score ?? 0) * 100).toFixed(0)}%
                    </div>
                    {previewResult.blast_radius && (
                      <div className="text-xs text-[var(--fg-muted)]">
                        Blast: scene {previewResult.blast_radius.scene ?? 0} · chapter {previewResult.blast_radius.chapter ?? 0} · universe {previewResult.blast_radius.universe ?? 0}
                      </div>
                    )}
                  </div>
                )}
                {previewResult.impacted_threads?.length ? (
                  <div>
                    <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Impacted threads</p>
                    {previewResult.impacted_threads.map((t, i) => (
                      <span key={i} className="mr-2 rounded bg-[rgba(139,92,246,0.15)] px-2 py-0.5 text-xs">{t.name}: {t.impact}</span>
                    ))}
                  </div>
                ) : null}
                {previewResult.impacts?.length ? (
                  <ul className="space-y-1 text-sm">
                    {previewResult.impacts.map((i, idx) => (
                      <li key={idx} className={`rounded px-2 py-1 ${
                        i.severity === "high" ? "bg-red-500/10 text-red-300" :
                        i.severity === "medium" ? "bg-amber-500/10 text-amber-300" :
                        "bg-[var(--bg-raised)] text-[var(--fg-secondary)]"
                      }`}>
                        [{i.type}] {i.target}: {i.description}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-200">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-red-300">
          {error}
        </div>
      )}

      {tab === "timeline" && (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--fg-primary)]">Timeline & Causality</h3>
        {timelineEvents.length === 0 ? (
          <p className="text-[var(--fg-muted)]">No events yet. Extract text to build the timeline.</p>
        ) : (
          <ol className="space-y-3">
            {timelineEvents.map((ev, i) => (
              <li key={ev.id} className="flex gap-3 rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-3">
                <span className="text-[var(--fg-muted)] shrink-0 font-mono text-sm">{i + 1}</span>
                <div>
                  <p className="font-medium text-[var(--fg-primary)]">{ev.name}</p>
                  {ev.summary && <p className="text-sm text-[var(--fg-muted)] mt-1">{ev.summary}</p>}
                  {ev.temporal != null ? <p className="text-xs text-[var(--fg-muted)] mt-1">When: {String(ev.temporal)}</p> : null}
                  {ev.caused_by && ev.caused_by.length > 0 && (
                    <p className="text-xs text-amber-400/90 mt-1">Caused by: {ev.caused_by.map((c) => c.name).join(", ")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
      )}

      {tab === "threads" && (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--fg-primary)]">Plot Threads</h3>
        {plotThreads.length === 0 ? (
          <p className="text-[var(--fg-muted)]">No plot threads yet. Extract text to discover threads.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plotThreads.map((t) => (
              <div key={t.id} className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--fg-primary)]">{t.name}</p>
                  <span className="rounded-full bg-[rgba(139,92,246,0.2)] px-2 py-0.5 text-xs text-[var(--fg-secondary)]">{t.status}</span>
                </div>
                {t.summary && <p className="text-sm text-[var(--fg-muted)] mt-2">{t.summary}</p>}
                {t.related_events.length > 0 && (
                  <p className="text-xs text-[var(--fg-muted)] mt-2">Events: {t.related_events.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {tab === "strategy" && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-[var(--fg-primary)]">Story Strategist</h3>
          <Button onClick={handleLoadStrategy} variant="secondary" disabled={authRequired}>Refresh</Button>
        </div>
        {strategy ? (
          <div className="space-y-4">
            {strategy.summary && <p className="text-[var(--fg-secondary)]">{strategy.summary}</p>}
            {strategy.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--fg-muted)] mb-2">Suggestions</h4>
                <ul className="space-y-2">
                  {strategy.suggestions.map((s, i) => (
                    <li key={i} className="rounded-md border border-[rgba(139,92,246,0.2)] p-3">
                      <p className="font-medium text-[var(--fg-primary)]">{s.title}</p>
                      <p className="text-sm text-[var(--fg-muted)] mt-1">{s.description}</p>
                      {s.priority && <span className="text-xs text-amber-400/90">{s.priority}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {strategy.opportunities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--fg-muted)] mb-2">Opportunities</h4>
                <ul className="space-y-2">
                  {strategy.opportunities.map((o, i) => (
                    <li key={i} className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <p className="font-medium text-[var(--fg-primary)]">{o.title}</p>
                      <p className="text-sm text-[var(--fg-muted)]">{o.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[var(--fg-muted)]">Click Refresh to get strategic guidance based on your story universe.</p>
        )}
      </div>
      )}

      {tab === "canon" && (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--fg-primary)]">Canon Ledger</h3>
        <p className="text-sm text-[var(--fg-muted)]">Structured truth with provenance — what the system believes, confidence, and source.</p>
        {canonFacts.length === 0 ? (
          <p className="text-[var(--fg-muted)]">No canon facts yet. Extract text to establish facts.</p>
        ) : (
          <div className="space-y-2">
            {canonFacts.map((f) => (
              <div key={f.id} className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-3">
                <p className="text-[var(--fg-primary)]">{f.fact_value}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--fg-muted)]">
                  <span>{f.fact_type}</span>
                  <span>{(f.confidence * 100).toFixed(0)}%</span>
                  <span>{f.canon_state}</span>
                  {f.source_passage && <span className="truncate max-w-xs">Source: {f.source_passage}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {tab === "qa" && (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[var(--fg-primary)]">Story Q&A</h3>
        <p className="text-sm text-[var(--fg-muted)]">Ask natural-language questions about your story. Answers are grounded in canon, objects, and relationships.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={qaQuestion}
            onChange={(e) => setQaQuestion(e.target.value)}
            placeholder="e.g. Who knows the secret? What caused the betrayal?"
            className="flex-1 rounded-md border border-[rgba(139,92,246,0.3)] bg-[var(--bg-base)] px-3 py-2 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]"
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <Button onClick={handleAsk} disabled={qaLoading || !qaQuestion.trim() || authRequired} aria-busy={qaLoading}>
            {qaLoading ? "Asking…" : "Ask"}
          </Button>
        </div>
        {qaResult && (
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 space-y-3">
            <p className="text-[var(--fg-primary)]">{qaResult.answer}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--fg-muted)]">Confidence: {(qaResult.confidence * 100).toFixed(0)}%</span>
              {qaResult.reasoning_summary && (
                <span className="text-xs text-[var(--fg-muted)]">· {qaResult.reasoning_summary}</span>
              )}
            </div>
            {qaResult.related_entities?.length ? (
              <div>
                <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Related</p>
                {qaResult.related_entities.map((e, i) => (
                  <span key={i} className="mr-2 rounded bg-[rgba(139,92,246,0.15)] px-2 py-0.5 text-xs">{e.name}: {e.role}</span>
                ))}
              </div>
            ) : null}
            {qaResult.ambiguity_notes?.length ? (
              <div className="rounded bg-amber-500/10 p-2 text-amber-200 text-sm">
                <p className="font-medium text-xs text-amber-400 mb-1">Uncertainty</p>
                {qaResult.ambiguity_notes.map((n, i) => (
                  <p key={i}>• {n}</p>
                ))}
              </div>
            ) : null}
            {qaResult.contradictory_evidence?.length ? (
              <div className="rounded bg-red-500/10 p-2 text-red-200 text-sm">
                <p className="font-medium text-xs text-red-400 mb-1">Contradictions</p>
                {qaResult.contradictory_evidence.map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>
            ) : null}
            {qaResult.citations?.length ? (
              <div className="pt-2 border-t border-[rgba(139,92,246,0.15)]">
                <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Citations</p>
                {qaResult.citations.map((c, i) => (
                  <p key={i} className="text-xs text-[var(--fg-secondary)]">• [{c.type}] {c.name}: {c.excerpt}</p>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
      )}

      {tab === "universe" && (
      <div className="h-[520px] overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(180deg,rgba(20,16,32,0.9),rgba(10,8,18,0.95))] shadow-[var(--shadow-md)]">
        {loading ? (
          <SkeletonGraph />
        ) : authRequired ? (
          <div className="flex h-full items-center justify-center text-[var(--fg-muted)]">
            Sign in to view your story universe.
          </div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--fg-muted)]">
            <p>No narrative objects yet.</p>
            <p className="text-sm">
              Paste text above and click Extract to build your story universe.
            </p>
          </div>
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(n: Record<string, unknown>) => {
              const name = (n.name as string) || "?";
              const type = (n.object_type as string) || "";
              const summary = (n.summary as string) || "";
              return `${name} [${type}]${summary ? ` — ${summary.slice(0, 80)}…` : ""}`;
            }}
            nodeColor={(n: Record<string, unknown>) =>
              typeColor((n.object_type as string) || "")
            }
            linkColor={() => "rgba(139,92,246,0.4)"}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowColor={() => "rgba(139,92,246,0.6)"}
          />
        )}
      </div>
      )}

      {tab === "universe" && !authRequired && objects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">
              Characters
            </h3>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">
              {objects.filter((o) => o.object_type === "character").length}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">Events</h3>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">
              {objects.filter((o) => o.object_type === "event").length}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            <h3 className="text-sm font-medium text-[var(--fg-muted)]">
              Plot threads
            </h3>
            <p className="text-2xl font-semibold text-[var(--fg-primary)]">
              {objects.filter((o) => o.object_type === "plot_thread").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UniversePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="h-8 w-32 animate-pulse rounded bg-[rgba(139,92,246,0.15)]" /></div>}>
      <UniverseContent />
    </Suspense>
  );
}

