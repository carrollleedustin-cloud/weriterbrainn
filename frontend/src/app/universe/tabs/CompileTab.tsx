"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { CompileResult, CompileIssue, PreviewResult } from "../types";

interface Props {
  compileText: string;
  onCompileTextChange: (val: string) => void;
  authRequired: boolean;
  compiling: boolean;
  onCompile: () => void;
  previewing: boolean;
  onPreview: () => void;
  echoLoading: boolean;
  onEchoes: () => void;
  compileResult: CompileResult | null;
  previewResult: PreviewResult | null;
  echoResult: { answer?: string; echoes?: Array<{ source?: string; suggestion?: string; emotional_impact?: string }> } | null;
}

export function CompileTab({
  compileText, onCompileTextChange, authRequired,
  compiling, onCompile, previewing, onPreview,
  echoLoading, onEchoes,
  compileResult, previewResult, echoResult,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[var(--fg-muted)] mb-2">Validate new text against canon (Continuity Guardian)</label>
        <div className="flex gap-2 flex-wrap">
          <Textarea
            value={compileText}
            onChange={(e) => onCompileTextChange(e.target.value)}
            placeholder="Paste new draft text. The compiler will check for continuity issues: dead characters, timeline breaks, lore violations, knowledge leaks."
            rows={4}
            disabled={authRequired}
          />
          <div className="flex flex-col gap-1 self-end">
            <Button onClick={onCompile} disabled={compiling || !compileText.trim() || authRequired} variant="secondary">
              {compiling ? "Checking..." : "Compile"}
            </Button>
            <Button onClick={onPreview} disabled={previewing || !compileText.trim() || authRequired} variant="secondary" className="text-xs">
              {previewing ? "Previewing..." : "Consequence Preview"}
            </Button>
            <Button onClick={onEchoes} disabled={echoLoading || !compileText.trim() || authRequired} variant="secondary" className="text-xs">
              {echoLoading ? "..." : "Story Echoes"}
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
                const iss = item as CompileIssue & { tier?: string };
                const severity = "severity" in item ? (item as { severity?: string }).severity : null;
                const tier = "tier" in item ? (item as { tier?: string }).tier : null;
                const category = "category" in item ? (item as { category?: string }).category : null;
                const isCritical = severity === "critical" || tier === "canon_break";
                const isHigh = severity === "high" || tier === "likely_contradiction";
                return (
                  <li key={i} className="cosmos-card rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isCritical ? "text-red-400" : isHigh ? "text-amber-400" : "text-[var(--fg-secondary)]"}`}>
                        {category ?? tier ?? "issue"}
                      </span>
                      {severity && <span className="rounded bg-[rgba(139,92,246,0.15)] px-1.5 py-0.5 text-xs">{severity}</span>}
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

          {echoResult && (
            <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs font-medium text-amber-400 mb-2">Story Echoes</p>
              <p className="text-sm text-[var(--fg-secondary)]">{echoResult.answer || "No echoes."}</p>
            </div>
          )}

          {previewResult && <PreviewSection result={previewResult} />}
        </div>
      )}
    </div>
  );
}

function PreviewSection({ result }: { result: PreviewResult }) {
  return (
    <div className="mt-4 space-y-4 border-t border-[rgba(139,92,246,0.2)] pt-4">
      <div>
        <p className="text-sm font-medium text-[var(--fg-muted)]">Consequence Preview V2</p>
        <p className="text-sm text-[var(--fg-secondary)] mt-1">{result.summary}</p>
        {result.delta_summary && <p className="text-xs text-[var(--fg-muted)] mt-1">{result.delta_summary}</p>}
      </div>
      {(result.risk_score !== undefined || result.opportunity_score !== undefined) && (
        <div className="flex gap-4">
          <div className="rounded-md bg-red-500/10 px-3 py-1.5 text-sm">Risk: {((result.risk_score ?? 0) * 100).toFixed(0)}%</div>
          <div className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-sm">Opportunity: {((result.opportunity_score ?? 0) * 100).toFixed(0)}%</div>
          {result.blast_radius && (
            <div className="text-xs text-[var(--fg-muted)]">
              Blast: scene {result.blast_radius.scene ?? 0} · chapter {result.blast_radius.chapter ?? 0} · universe {result.blast_radius.universe ?? 0}
            </div>
          )}
        </div>
      )}
      {result.impacted_threads?.length ? (
        <div>
          <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Impacted threads</p>
          {result.impacted_threads.map((t, i) => (
            <span key={i} className="mr-2 rounded bg-[rgba(139,92,246,0.15)] px-2 py-0.5 text-xs">{t.name}: {t.impact}</span>
          ))}
        </div>
      ) : null}
      {result.impacts?.length ? (
        <ul className="space-y-1 text-sm">
          {result.impacts.map((impact, idx) => (
            <li key={idx} className={`rounded px-2 py-1 ${
              impact.severity === "high" ? "bg-red-500/10 text-red-300" :
              impact.severity === "medium" ? "bg-amber-500/10 text-amber-300" :
              "bg-[var(--bg-raised)] text-[var(--fg-secondary)]"
            }`}>
              [{impact.type}] {impact.target}: {impact.description}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
