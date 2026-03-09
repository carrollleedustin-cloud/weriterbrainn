"use client";

import { useState, useEffect } from "react";
import { getNarrativeCharacters, getCharacterDetails, getMe } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Character = { id: string; name: string; summary?: string; metadata?: Record<string, unknown> };

export default function CastPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [details, setDetails] = useState<{
    name?: string;
    summary?: string;
    metadata?: {
      goals?: string[];
      fears?: string[];
      beliefs?: string[];
      loyalties?: string[];
      desires?: string[];
      trust_edges?: Array<{ target: string; level: string }>;
      internal_conflicts?: string[];
      arc_phase?: string;
      arc_hint?: string;
      out_of_character_risk?: string;
    };
    relationships?: Array<{ type: string; other: string }>;
    knowledge?: Array<{ fact_key: string; assertion_type: string; confidence: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    getMe().then((me) => {
      if (!me) {
        setAuthRequired(true);
        setCharacters([]);
        setLoading(false);
        return;
      }
      getNarrativeCharacters()
        .then(setCharacters)
        .catch(() => setCharacters([]))
        .finally(() => setLoading(false));
    });
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetails(null);
      return;
    }
    setDetails(null);
    getCharacterDetails(selected.id)
      .then((d) => setDetails(d))
      .catch(() => setDetails(null));
  }, [selected?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--fg-primary)]">Cast</h1>
        <p className="text-sm text-[var(--fg-muted)]">Character intelligence — goals, fears, knowledge, relationships.</p>
      </div>

      {authRequired && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
          Sign in to view characters.
        </div>
      )}

      {loading && !authRequired ? (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : characters.length === 0 && !authRequired ? (
        <p className="text-[var(--fg-muted)]">No characters yet. Extract narrative text in Story Universe to build your cast.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected({ id: c.id, name: c.name })}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  selected?.id === c.id
                    ? "bg-[rgba(139,92,246,0.25)] text-[var(--fg-primary)]"
                    : "text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
            {selected ? (
              details ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-medium text-[var(--fg-primary)]">{details.name ?? selected.name}</h2>
                  {details.summary && <p className="text-sm text-[var(--fg-muted)]">{details.summary}</p>}
                  {(details.metadata?.goals ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Goals</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.goals ?? []).map((g, i) => (
                          <li key={i}>• {g}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.fears ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Fears</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.fears ?? []).map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.beliefs ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Beliefs</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.beliefs ?? []).map((b, i) => (
                          <li key={i}>• {b}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.loyalties ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Loyalties</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.loyalties ?? []).map((l, i) => (
                          <li key={i}>• {l}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.desires ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Desires</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.desires ?? []).map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.internal_conflicts ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-amber-400/90">Internal conflicts</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.internal_conflicts ?? []).map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {(details.metadata?.arc_phase || details.metadata?.arc_hint) ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Arc</h3>
                      <p className="text-sm text-[var(--fg-secondary)]">
                        {details.metadata?.arc_phase}
                        {details.metadata?.arc_hint ? ` — ${details.metadata.arc_hint}` : ""}
                      </p>
                    </div>
                  ) : null}
                  {(details.metadata?.trust_edges ?? [])?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Trust</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {(details.metadata?.trust_edges ?? []).map((te: { target: string; level: string }, i: number) => (
                          <li key={i}>→ {te.target}: {te.level}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {details.metadata?.out_of_character_risk ? (
                    <p className="text-xs text-amber-400/90">OOC risk: {details.metadata.out_of_character_risk}</p>
                  ) : null}
                  {details.knowledge?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Knowledge state</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {details.knowledge.map((k, i) => (
                          <li key={i}>• {k.fact_key} ({k.assertion_type}, {(k.confidence * 100).toFixed(0)}%)</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {details.relationships?.length ? (
                    <div>
                      <h3 className="text-xs font-medium uppercase text-[var(--fg-muted)]">Relationships</h3>
                      <ul className="mt-1 space-y-1 text-sm text-[var(--fg-secondary)]">
                        {details.relationships.map((r, i) => (
                          <li key={i}>— {r.type}: {r.other}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[85%]" />
                  <Skeleton className="h-4 w-20 mt-4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )
            ) : (
              <p className="text-[var(--fg-muted)]">Select a character</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
