"use client";

import { motion } from "framer-motion";
import { phaseTransition } from "./shared";

export function QuestionPhase({ onNext }: { onNext: () => void }) {
  return (
    <motion.div key="question" {...phaseTransition} className="text-center">
      <h2 className="mb-8 text-2xl font-light">You have chosen to become the architect.</h2>
      <p className="mb-12 text-[var(--fg-secondary)]">
        The Mirror of Truth will reflect your story impulse. Speak one sentence.
      </p>
      <button
        onClick={onNext}
        className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] transition hover:bg-[rgba(139,92,246,0.1)]"
      >
        Enter the Mirror
      </button>
    </motion.div>
  );
}
