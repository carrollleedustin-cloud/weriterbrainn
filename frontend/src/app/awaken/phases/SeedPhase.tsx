"use client";

import { motion } from "framer-motion";
import { GenesisBurst } from "@/components/nio/GenesisBurst";
import { phaseTransition } from "./shared";

interface Props {
  seed: { character: string; conflict: string; change: string };
  onSeedChange: (patch: Partial<Props["seed"]>) => void;
  onNext: () => void;
}

export function SeedPhase({ seed, onSeedChange, onNext }: Props) {
  return (
    <motion.div key="seed" {...phaseTransition} className="w-full max-w-xl space-y-6">
      <h2 className="text-center text-xl font-light">The Seed of Worlds</h2>
      <p className="text-center text-sm text-[var(--fg-muted)]">
        Three core seeds: Character, Conflict, Change
      </p>
      <div className="space-y-4">
        {(["character", "conflict", "change"] as const).map((field) => (
          <input
            key={field}
            type="text"
            value={seed[field]}
            onChange={(e) => onSeedChange({ [field]: e.target.value })}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            className="w-full rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.8)] px-4 py-3 placeholder:text-[var(--fg-muted)] focus:border-[rgba(139,92,246,0.6)] focus:outline-none"
          />
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-center py-6">
        <GenesisBurst seed={seed} />
      </motion.div>
      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] hover:bg-[rgba(139,92,246,0.1)]"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
