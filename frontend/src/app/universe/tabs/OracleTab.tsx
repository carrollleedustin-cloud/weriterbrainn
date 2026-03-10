"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { QAResult } from "../types";

interface Props {
  character: string;
  onCharacterChange: (val: string) => void;
  situation: string;
  onSituationChange: (val: string) => void;
  loading: boolean;
  authRequired: boolean;
  result: (QAResult & { character?: string; situation?: string }) | null;
  onSimulate: () => void;
}

export function OracleTab({ character, onCharacterChange, situation, onSituationChange, loading, authRequired, result, onSimulate }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--fg-primary)]">AI Narrative Oracle</h3>
      <p className="text-sm text-[var(--fg-muted)]">Simulate what a character would do. The Oracle reasons from psychology, goals, relationships.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-[var(--fg-muted)] mb-1">Character</label>
          <input
            type="text"
            value={character}
            onChange={(e) => onCharacterChange(e.target.value)}
            placeholder="e.g. Marcus"
            className="w-full rounded-md border border-[rgba(139,92,246,0.3)] bg-[var(--bg-base)] px-3 py-2 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-[var(--fg-muted)] mb-1">Situation</label>
          <Textarea
            value={situation}
            onChange={(e) => onSituationChange(e.target.value)}
            placeholder="e.g. Sarah just revealed she knew about the dagger. Marcus is alone with her."
            rows={3}
          />
        </div>
      </div>
      <Button onClick={onSimulate} disabled={loading || !character.trim() || !situation.trim() || authRequired}>
        {loading ? "Simulating…" : "What would they do?"}
      </Button>
      {result && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
          <p className="font-medium text-emerald-200">Oracle: {result.answer}</p>
          {result.reasoning_summary && <p className="text-sm text-[var(--fg-muted)]">{result.reasoning_summary}</p>}
        </div>
      )}
    </div>
  );
}
