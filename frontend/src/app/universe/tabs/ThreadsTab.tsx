"use client";

import type { PlotThread } from "../types";

interface Props {
  threads: PlotThread[];
}

export function ThreadsTab({ threads }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">Plot Threads</h3>
      {threads.length === 0 ? (
        <p className="text-[var(--fg-muted)]">No plot threads yet. Extract text to discover threads.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {threads.map((t) => (
            <div key={t.id} className="cosmos-card rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[var(--fg-primary)]">{t.name}</p>
                <span className="rounded-full bg-[rgba(139,92,246,0.2)] px-2 py-0.5 text-xs text-[var(--fg-secondary)]">{t.status}</span>
              </div>
              {t.summary && <p className="text-sm text-[var(--fg-muted)] mt-2">{t.summary}</p>}
              {(t.related_events?.length ?? 0) > 0 && (
                <p className="text-xs text-[var(--fg-muted)] mt-2">Events: {t.related_events!.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
