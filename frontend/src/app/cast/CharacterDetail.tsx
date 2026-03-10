"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { OrbitMenu } from "@/components/nio/OrbitMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CharacterDetailView } from "./types";

interface Props {
  selected: { id: string; name: string };
  details: CharacterDetailView | null;
}

const TRAIT_SECTIONS: Array<{
  key: "goals" | "fears" | "beliefs" | "loyalties" | "desires";
  label: string;
  tagColor: string;
}> = [
  { key: "goals", label: "Goals", tagColor: "emerald" },
  { key: "fears", label: "Fears", tagColor: "red" },
  { key: "beliefs", label: "Beliefs", tagColor: "blue" },
  { key: "loyalties", label: "Loyalties", tagColor: "" },
  { key: "desires", label: "Desires", tagColor: "amber" },
];

export function CharacterDetail({ selected, details }: Props) {
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [orbitAnchor, setOrbitAnchor] = useState({ x: 0, y: 0 });
  const orbitAnchorRef = useRef<HTMLButtonElement | null>(null);

  const openOrbit = () => {
    if (orbitAnchorRef.current) {
      const r = orbitAnchorRef.current.getBoundingClientRect();
      setOrbitAnchor({ x: r.left + r.width / 2, y: r.bottom + 36 });
    }
    setOrbitOpen((o) => !o);
  };

  if (!details) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-20 mt-4" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const meta = details.metadata;
  const hasMindspace =
    (meta?.goals?.length ?? 0) + (meta?.fears?.length ?? 0) +
    (meta?.beliefs?.length ?? 0) + (meta?.desires?.length ?? 0) > 0;

  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-[var(--fg-primary)]">{details.name ?? selected.name}</h2>
        <button
          ref={orbitAnchorRef}
          type="button"
          onClick={openOrbit}
          className="shrink-0 rounded-full border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.08)] px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--fg-muted)] transition hover:border-[rgba(139,92,246,0.7)] hover:text-[var(--fg-primary)]"
        >
          Orbit
        </button>
      </div>
      <AnimatePresence>
        <OrbitMenu
          open={orbitOpen}
          onClose={() => setOrbitOpen(false)}
          anchor={orbitAnchor}
          actions={[
            { label: "Mindspace", href: `/mindspace/${selected.id}` },
            { label: "River", href: "/river" },
            { label: "Loom", href: "/loom" },
            { label: "Forge", href: "/writing" },
            { label: "Simulate", href: "/simulation" },
          ]}
        />
      </AnimatePresence>

      {details.summary && <p className="text-sm text-[var(--fg-muted)]">{details.summary}</p>}

      {hasMindspace && (
        <div className="rounded-lg border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(180deg,rgba(20,16,32,0.6),rgba(10,8,18,0.8))] p-4">
          <p className="text-xs font-medium uppercase text-[var(--fg-muted)] mb-3">Mindspace</p>
          <div className="flex flex-wrap gap-2">
            {(["goals", "fears", "beliefs", "desires"] as const).map((key) => {
              const color = key === "goals" ? "emerald" : key === "fears" ? "red" : key === "beliefs" ? "blue" : "amber";
              return (meta?.[key] ?? []).map((v, i) => (
                <span key={`${key}-${i}`} className={`rounded-full border border-${color}-500/40 bg-${color}-500/10 px-2.5 py-1 text-xs text-${color}-200`}>
                  {key.slice(0, -1)}: {String(v).slice(0, 24)}{String(v).length > 24 ? "…" : ""}
                </span>
              ));
            })}
          </div>
        </div>
      )}

      {TRAIT_SECTIONS.map(({ key, label }) => {
        const items = meta?.[key] ?? [];
        if (!items.length) return null;
        return (
          <div key={key}>
            <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">{label}</h3>
            <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
              {items.map((v, i) => <li key={i}>• {v}</li>)}
            </ul>
          </div>
        );
      })}

      {(meta?.internal_conflicts ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-amber-400/90">Internal conflicts</h3>
          <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
            {(meta?.internal_conflicts ?? []).map((c, i) => <li key={i}>• {c}</li>)}
          </ul>
        </div>
      )}

      {(meta?.arc_phase || meta?.arc_hint) && (
        <div>
          <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Arc</h3>
          <p className="text-sm text-[var(--fg-secondary)]">
            {meta?.arc_phase}{meta?.arc_hint ? ` — ${meta.arc_hint}` : ""}
          </p>
        </div>
      )}

      {(meta?.trust_edges ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Trust</h3>
          <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
            {(meta?.trust_edges ?? []).map((te, i) => <li key={i}>→ {te.target}: {te.level}</li>)}
          </ul>
        </div>
      )}

      {meta?.out_of_character_risk && (
        <p className="text-xs text-amber-400/90">OOC risk: {meta.out_of_character_risk}</p>
      )}

      {(details.knowledge ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Knowledge state</h3>
          <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
            {details.knowledge!.map((k, i) => <li key={i}>• {k.fact_key} ({k.assertion_type}, {(k.confidence * 100).toFixed(0)}%)</li>)}
          </ul>
        </div>
      )}

      {(details.relationships ?? []).length > 0 && (
        <div>
          <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Relationships</h3>
          <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
            {details.relationships!.map((r, i) => <li key={i}>— {r.type}: {r.other}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
