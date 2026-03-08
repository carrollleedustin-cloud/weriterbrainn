"use client";

import { useState, useEffect } from "react";
import { getNarrativeCharacters, getCharacterDetails, getMe } from "@/lib/api";
import { Button } from "@/components/ui/Button";

type Character = { id: string; name: string; summary?: string; metadata?: Record<string, unknown> };

export default function CastPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [details, setDetails] = useState<{
    name?: string;
    summary?: string;
    metadata?: { goals?: string[]; fears?: string[]; knowledge?: string[] };
    relationships?: Array<{ type: string; other: string }>;
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
        <p className="text-[var(--fg-muted)]">Loading...</p>
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
                <p className="text-[var(--fg-muted)]">Loading details...</p>
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
