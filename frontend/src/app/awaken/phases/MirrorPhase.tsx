"use client";

import { motion } from "framer-motion";
import { MIRROR_VARIATIONS } from "@/lib/demo-data";
import { phaseTransition } from "./shared";

interface Props {
  mirrorInput: string;
  onMirrorInputChange: (val: string) => void;
  mirrorChoice: string | null;
  onMirrorChoiceChange: (val: string | null) => void;
  onNext: () => void;
}

export function MirrorPhase({ mirrorInput, onMirrorInputChange, mirrorChoice, onMirrorChoiceChange, onNext }: Props) {
  return (
    <motion.div key="mirror" {...phaseTransition} className="w-full max-w-2xl space-y-8">
      <h2 className="text-center text-xl font-light">The Mirror of Truth</h2>
      <p className="text-center text-sm text-[var(--fg-muted)]">
        One sentence about yourself, your story impulse, or what you need to create.
      </p>
      <input
        type="text"
        value={mirrorInput}
        onChange={(e) => onMirrorInputChange(e.target.value)}
        placeholder="I write to understand what I cannot say aloud."
        className="w-full rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-4 py-3 text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {MIRROR_VARIATIONS.map((v) => (
          <button
            key={v.id}
            onClick={() => onMirrorChoiceChange(v.id)}
            className={`rounded-lg border p-4 text-left text-sm transition ${
              mirrorChoice === v.id
                ? "border-[rgba(139,92,246,0.8)] bg-[rgba(139,92,246,0.15)]"
                : "border-[rgba(139,92,246,0.25)] hover:border-[rgba(139,92,246,0.5)]"
            }`}
          >
            <span className="font-medium text-[rgba(167,139,250,0.9)]">{v.label}</span>
            <p className="mt-1 text-[var(--fg-secondary)]">{v.text}</p>
          </button>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onNext}
          disabled={!mirrorChoice}
          className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] disabled:opacity-40 hover:bg-[rgba(139,92,246,0.1)]"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
