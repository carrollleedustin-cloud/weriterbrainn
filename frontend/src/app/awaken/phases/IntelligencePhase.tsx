"use client";

import { motion } from "framer-motion";
import { phaseTransition, INTELLIGENCE_MODES } from "./shared";

interface Props {
  intelligenceMode: string;
  onModeChange: (id: string) => void;
  onNext: () => void;
}

export function IntelligencePhase({ intelligenceMode, onModeChange, onNext }: Props) {
  return (
    <motion.div key="intelligence" {...phaseTransition} className="w-full max-w-2xl space-y-6">
      <h2 className="text-center text-xl font-light">Intelligence Mode</h2>
      <p className="text-center text-sm text-[var(--fg-muted)]">
        The embedded narrative presence will adapt to your chosen mode.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {INTELLIGENCE_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`rounded-lg border p-4 text-left transition ${
              intelligenceMode === m.id
                ? "border-[rgba(139,92,246,0.8)] bg-[rgba(139,92,246,0.15)]"
                : "border-[rgba(139,92,246,0.25)] hover:border-[rgba(139,92,246,0.5)]"
            }`}
          >
            <span className="font-medium text-[rgba(167,139,250,0.9)]">{m.label}</span>
            <p className="mt-1 text-xs text-[var(--fg-secondary)]">{m.desc}</p>
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] hover:bg-[rgba(139,92,246,0.1)]"
        >
          Ignite Universe
        </button>
      </div>
    </motion.div>
  );
}
