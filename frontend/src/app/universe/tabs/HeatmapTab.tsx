"use client";

import type { TimelineEvent } from "../types";

interface Props {
  events: TimelineEvent[];
}

export function HeatmapTab({ events }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">Narrative Heatmap</h3>
      <p className="text-sm text-[var(--fg-muted)]">Emotional intensity across your story. Brighter = higher intensity.</p>
      {events.length === 0 ? (
        <p className="text-[var(--fg-muted)]">No events yet. Extract text to build the timeline.</p>
      ) : (
        <div className="flex gap-1 h-12 items-center">
          {events.map((ev, i) => {
            const intensity = 0.3 + (i % 5) * 0.15 + (ev.caused_by?.length || 0) * 0.1;
            const op = Math.min(1, intensity);
            return (
              <div
                key={ev.id}
                title={ev.name}
                className="flex-1 rounded min-w-[8px] h-10 transition-all hover:scale-105"
                style={{ background: `rgba(139,92,246,${op})`, opacity: 0.5 + op * 0.5 }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
