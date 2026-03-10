"use client";

import type { CanonFact } from "../types";

interface Props {
  facts: CanonFact[];
}

export function CanonTab({ facts }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">Canon Ledger</h3>
      <p className="text-sm text-[var(--fg-muted)]">Structured truth with provenance — what the system believes, confidence, and source.</p>
      {facts.length === 0 ? (
        <p className="text-[var(--fg-muted)]">No canon facts yet. Extract text to establish facts.</p>
      ) : (
        <div className="space-y-2">
          {facts.map((f) => (
            <div key={f.id} className="cosmos-card rounded-lg p-3">
              <p className="text-[var(--fg-primary)]">{f.fact_value}</p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--fg-muted)]">
                <span>{f.fact_type}</span>
                <span>{((f.confidence ?? 0) * 100).toFixed(0)}%</span>
                <span>{f.canon_state}</span>
                {f.source_passage && <span className="truncate max-w-xs">Source: {f.source_passage}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
