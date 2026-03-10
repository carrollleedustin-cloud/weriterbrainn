"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getNarrativeCharacters, getCharacterDetails } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Skeleton } from "@/components/ui/Skeleton";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import { AuthGate } from "@/components/nio/AuthGate";
import { CharacterDetail } from "./CharacterDetail";
import type { Character, CharacterDetailView } from "./types";

function CastContent() {
  const searchParams = useSearchParams();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [details, setDetails] = useState<CharacterDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    if (authStatus === "idle" || authStatus === "loading") return;
    if (authStatus === "anonymous") { setLoading(false); return; }
    getNarrativeCharacters()
      .then(setCharacters)
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false));
  }, [authStatus]);

  const requestedId = searchParams.get("c");
  const requestedCharacter = requestedId ? characters.find((x) => x.id === requestedId) : null;

  useEffect(() => {
    if (!selected?.id) return;
    getCharacterDetails(selected.id)
      .then((d) => setDetails(d as CharacterDetailView))
      .catch(() => setDetails(null));
  }, [selected?.id]);

  const header = (
    <DimensionHeader
      title={<>Character <span className="gradient-text">Mindspace</span></>}
      subtitle="Desire peaks, fear trenches, secret chambers, breaking points."
    />
  );

  return (
    <AuthGate fallbackHeader={header}>
      <div className="space-y-6">
        {header}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
            <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : characters.length === 0 ? (
          <p className="text-[var(--fg-muted)]">No characters yet. Extract narrative text in Story Universe to build your cast.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              {characters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelected({ id: c.id, name: c.name }); setDetails(null); }}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                    selected?.id === c.id
                      ? "bg-[linear-gradient(135deg,rgba(139,92,246,0.3),rgba(139,92,246,0.15))] text-[var(--fg-primary)] shadow-[0_0_16px_rgba(139,92,246,0.2)]"
                      : "text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.12)]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="cosmos-card rounded-lg p-4">
              {selected ? (
                <CharacterDetail selected={selected} details={details} />
              ) : requestedCharacter ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--fg-muted)]">Loading {requestedCharacter.name}…</p>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <p className="text-[var(--fg-muted)]">Select a character</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}

export default function CastPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>}>
      <CastContent />
    </Suspense>
  );
}
