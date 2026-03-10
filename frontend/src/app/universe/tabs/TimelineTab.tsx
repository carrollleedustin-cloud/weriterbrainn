"use client";

import type { TimelineEvent } from "../types";

interface Props {
  events: TimelineEvent[];
}

export function TimelineTab({ events }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">Timeline & Causality</h3>
      {events.length === 0 ? (
        <p className="text-[var(--fg-muted)]">No events yet. Extract text to build the timeline.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((ev, i) => (
            <li key={ev.id} className="cosmos-card flex gap-3 rounded-lg p-3">
              <span className="text-[var(--fg-muted)] shrink-0 font-mono text-sm">{i + 1}</span>
              <div>
                <p className="font-medium text-[var(--fg-primary)]">{ev.name}</p>
                {ev.summary && <p className="text-sm text-[var(--fg-muted)] mt-1">{ev.summary}</p>}
                {ev.temporal != null && <p className="text-xs text-[var(--fg-muted)] mt-1">When: {String(ev.temporal)}</p>}
                {ev.caused_by && ev.caused_by.length > 0 && (
                  <p className="text-xs text-amber-400/90 mt-1">Caused by: {ev.caused_by.map((c) => c.name).join(", ")}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
