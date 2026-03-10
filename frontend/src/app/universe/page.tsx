"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  narrativeExtract, narrativeCompile, narrativePreview,
  narrativeAsk, oracleSimulate, storyEchoes,
  getNarrativeObjects, getNarrativeEdges,
  getNarrativeTimeline, getNarrativePlotThreads,
  getNarrativeStrategy, getCanonFacts, getMe,
} from "@/lib/api";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import type {
  Tab, NarrativeObject, NarrativeEdge, TimelineEvent,
  PlotThread, StrategyResult, CompileResult, QAResult,
  PreviewResult, CompileIssue, CanonFact,
} from "./types";
import { VALID_TABS } from "./types";
import { UniverseTab } from "./tabs/UniverseTab";
import { CompileTab } from "./tabs/CompileTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { ThreadsTab } from "./tabs/ThreadsTab";
import { StrategyTab } from "./tabs/StrategyTab";
import { CanonTab } from "./tabs/CanonTab";
import { HeatmapTab } from "./tabs/HeatmapTab";
import { QATab } from "./tabs/QATab";
import { OracleTab } from "./tabs/OracleTab";

function UniverseContent() {
  const [objects, setObjects] = useState<NarrativeObject[]>([]);
  const [edges, setEdges] = useState<NarrativeEdge[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [plotThreads, setPlotThreads] = useState<PlotThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  // Tab state
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl as Tab) ? (tabFromUrl as Tab) : "universe"
  );
  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as Tab)) setTab(tabFromUrl as Tab);
  }, [tabFromUrl]);

  // Extract form
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Compile form
  const [compileText, setCompileText] = useState("");
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [echoResult, setEchoResult] = useState<{ answer?: string; echoes?: Array<{ source?: string; suggestion?: string; emotional_impact?: string }> } | null>(null);
  const [echoLoading, setEchoLoading] = useState(false);

  // Strategy
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);

  // Canon
  const [canonFacts, setCanonFacts] = useState<CanonFact[]>([]);

  // QA
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [qaLoading, setQaLoading] = useState(false);

  // Oracle
  const [oracleCharacter, setOracleCharacter] = useState("");
  const [oracleSituation, setOracleSituation] = useState("");
  const [oracleResult, setOracleResult] = useState<QAResult & { character?: string; situation?: string } | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);

  // ---------- Data loading ----------

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await getMe();
      if (!me) { setAuthRequired(true); return; }
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
      if (err instanceof Error && err.message.includes("401")) setAuthRequired(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === "strategy" && !authRequired && objects.length > 0)
      getNarrativeStrategy().then((r) => setStrategy(r as StrategyResult)).catch(() => setStrategy(null));
  }, [tab, authRequired, objects.length]);

  useEffect(() => {
    if (tab === "canon" && !authRequired)
      getCanonFacts().then((r) => setCanonFacts(r.facts || [])).catch(() => setCanonFacts([]));
  }, [tab, authRequired]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // ---------- Handlers ----------

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    setExtracting(true); setError(null); setSuccess(null);
    try {
      await narrativeExtract(extractText.trim());
      setExtractText("");
      setSuccess("Extraction complete — universe updated.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
      if (err instanceof Error && err.message.includes("401")) setAuthRequired(true);
    } finally { setExtracting(false); }
  };

  const handleCompile = async () => {
    if (!compileText.trim()) return;
    setCompiling(true); setError(null); setSuccess(null);
    try {
      const result = await narrativeCompile(compileText.trim()) as CompileResult;
      setCompileResult(result);
      setSuccess(result.overall_tier === "ok" ? "Compile passed — no issues." : "Compile complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compile failed");
      setCompileResult(null);
    } finally { setCompiling(false); }
  };

  const handlePreview = async () => {
    if (!compileText.trim()) return;
    setPreviewing(true); setError(null);
    try {
      const result = await narrativePreview(compileText.trim()) as PreviewResult & { compile_issues?: CompileIssue[] };
      setPreviewResult(result);
      if ((result.compile_alerts?.length || result.compile_issues?.length) && !compileResult) {
        setCompileResult({ alerts: result.compile_alerts as CompileResult["alerts"], issues: result.compile_issues, overall_tier: "ok" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
      setPreviewResult(null);
    } finally { setPreviewing(false); }
  };

  const handleEchoes = async () => {
    const ctx = compileText.trim();
    if (!ctx) return;
    setEchoLoading(true); setError(null);
    try {
      setEchoResult(await storyEchoes(ctx) as NonNullable<typeof echoResult>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echoes failed");
      setEchoResult(null);
    } finally { setEchoLoading(false); }
  };

  const handleAsk = async () => {
    if (!qaQuestion.trim()) return;
    setQaLoading(true); setError(null);
    try { setQaResult(await narrativeAsk(qaQuestion.trim()) as QAResult); }
    catch (err) { setError(err instanceof Error ? err.message : "Q&A failed"); setQaResult(null); }
    finally { setQaLoading(false); }
  };

  const handleOracleSimulate = async () => {
    if (!oracleCharacter.trim() || !oracleSituation.trim()) return;
    setOracleLoading(true); setError(null);
    try { setOracleResult(await oracleSimulate(oracleCharacter.trim(), oracleSituation.trim()) as NonNullable<typeof oracleResult>); }
    catch (err) { setError(err instanceof Error ? err.message : "Oracle failed"); setOracleResult(null); }
    finally { setOracleLoading(false); }
  };

  const handleLoadStrategy = async () => {
    setError(null);
    try { setStrategy(await getNarrativeStrategy() as StrategyResult); }
    catch (err) { setError(err instanceof Error ? err.message : "Strategy load failed"); setStrategy(null); }
  };

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      <DimensionHeader
        title={<>Story <span className="gradient-text">Cosmos</span></>}
        subtitle="Navigable narrative galaxy — characters as stars, events as flares, threads as luminous trajectories."
        showDimensionNav={false}
      />

      <nav className="flex flex-wrap gap-2 border-b border-[rgba(139,92,246,0.2)] pb-2">
        {VALID_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab-pill rounded-lg px-4 py-2 text-sm capitalize ${
              tab === t ? "tab-pill-active text-[var(--fg-primary)]" : "text-[var(--fg-muted)]"
            }`}
          >
            {t === "qa" ? "Q&A" : t === "canon" ? "Canon" : t === "oracle" ? "Oracle" : t === "heatmap" ? "Heatmap" : t}
          </button>
        ))}
      </nav>

      {authRequired && (
        <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to use the Story Universe. Narrative extraction and the universe model require authentication.
        </div>
      )}

      {tab === "universe" && (
        <UniverseTab
          objects={objects} edges={edges} loading={loading} authRequired={authRequired}
          extractText={extractText} onExtractTextChange={setExtractText}
          extracting={extracting} onExtract={handleExtract}
        />
      )}
      {tab === "compile" && (
        <CompileTab
          compileText={compileText} onCompileTextChange={setCompileText}
          authRequired={authRequired} compiling={compiling} onCompile={handleCompile}
          previewing={previewing} onPreview={handlePreview}
          echoLoading={echoLoading} onEchoes={handleEchoes}
          compileResult={compileResult} previewResult={previewResult} echoResult={echoResult}
        />
      )}
      {tab === "timeline" && <TimelineTab events={timelineEvents} />}
      {tab === "threads" && <ThreadsTab threads={plotThreads} />}
      {tab === "strategy" && <StrategyTab strategy={strategy} authRequired={authRequired} onRefresh={handleLoadStrategy} />}
      {tab === "canon" && <CanonTab facts={canonFacts} />}
      {tab === "heatmap" && <HeatmapTab events={timelineEvents} />}
      {tab === "qa" && <QATab question={qaQuestion} onQuestionChange={setQaQuestion} loading={qaLoading} authRequired={authRequired} result={qaResult} onAsk={handleAsk} />}
      {tab === "oracle" && (
        <OracleTab
          character={oracleCharacter} onCharacterChange={setOracleCharacter}
          situation={oracleSituation} onSituationChange={setOracleSituation}
          loading={oracleLoading} authRequired={authRequired} result={oracleResult} onSimulate={handleOracleSimulate}
        />
      )}

      {success && <div className="rounded-[var(--radius-md)] border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-200">{success}</div>}
      {error && <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-red-300">{error}</div>}
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
