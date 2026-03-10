"use client";

import { Button } from "@/components/ui/Button";
import type { QAResult } from "../types";

interface Props {
  question: string;
  onQuestionChange: (val: string) => void;
  loading: boolean;
  authRequired: boolean;
  result: QAResult | null;
  onAsk: () => void;
}

export function QATab({ question, onQuestionChange, loading, authRequired, result, onAsk }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">Story Q&A</h3>
      <p className="text-sm text-[var(--fg-muted)]">Ask natural-language questions about your story. Answers are grounded in canon, objects, and relationships.</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="e.g. Who knows the secret? What caused the betrayal?"
          className="flex-1 rounded-md border border-[rgba(139,92,246,0.3)] bg-[var(--bg-base)] px-3 py-2 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]"
          onKeyDown={(e) => e.key === "Enter" && onAsk()}
        />
        <Button onClick={onAsk} disabled={loading || !question.trim() || authRequired} aria-busy={loading}>
          {loading ? "Asking…" : "Ask"}
        </Button>
      </div>
      {result && (
        <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 space-y-3">
          <p className="text-[var(--fg-primary)]">{result.answer}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--fg-muted)]">Confidence: {(result.confidence * 100).toFixed(0)}%</span>
            {result.reasoning_summary && <span className="text-xs text-[var(--fg-muted)]">· {result.reasoning_summary}</span>}
          </div>
          {result.related_entities?.length ? (
            <div>
              <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Related</p>
              {result.related_entities.map((e, i) => (
                <span key={i} className="mr-2 rounded bg-[rgba(139,92,246,0.15)] px-2 py-0.5 text-xs">{e.name}: {e.role}</span>
              ))}
            </div>
          ) : null}
          {result.ambiguity_notes?.length ? (
            <div className="rounded bg-amber-500/10 p-2 text-amber-200 text-sm">
              <p className="font-medium text-xs text-amber-400 mb-1">Uncertainty</p>
              {result.ambiguity_notes.map((n, i) => <p key={i}>• {n}</p>)}
            </div>
          ) : null}
          {result.contradictory_evidence?.length ? (
            <div className="rounded bg-red-500/10 p-2 text-red-200 text-sm">
              <p className="font-medium text-xs text-red-400 mb-1">Contradictions</p>
              {result.contradictory_evidence.map((c, i) => <p key={i}>• {c}</p>)}
            </div>
          ) : null}
          {result.citations?.length ? (
            <div className="pt-2 border-t border-[rgba(139,92,246,0.15)]">
              <p className="text-xs font-medium text-[var(--fg-muted)] mb-1">Citations</p>
              {result.citations.map((c, i) => (
                <p key={i} className="text-xs text-[var(--fg-secondary)]">• [{c.type}] {c.name}: {c.excerpt}</p>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
