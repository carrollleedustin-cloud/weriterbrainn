"use client";

import { Button } from "@/components/ui/Button";
import type { StrategyResult } from "../types";

interface Props {
  strategy: StrategyResult | null;
  authRequired: boolean;
  onRefresh: () => void;
}

export function StrategyTab({ strategy, authRequired, onRefresh }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[var(--fg-primary)]">Story Strategist</h3>
        <Button onClick={onRefresh} variant="secondary" disabled={authRequired}>Refresh</Button>
      </div>
      {strategy ? (
        <div className="space-y-4">
          {strategy.summary && <p className="text-[var(--fg-secondary)]">{strategy.summary}</p>}
          {(strategy.suggestions?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--fg-muted)] mb-2">Suggestions</h4>
              <ul className="space-y-2">
                {strategy.suggestions!.map((s, i) => (
                  <li key={i} className="rounded-md border border-[rgba(139,92,246,0.2)] p-3">
                    <p className="font-medium text-[var(--fg-primary)]">{s.title}</p>
                    <p className="text-sm text-[var(--fg-muted)] mt-1">{s.description}</p>
                    {s.priority && <span className="text-xs text-amber-400/90">{s.priority}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(strategy.opportunities?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[var(--fg-muted)] mb-2">Opportunities</h4>
              <ul className="space-y-2">
                {strategy.opportunities!.map((o, i) => (
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
  );
}
