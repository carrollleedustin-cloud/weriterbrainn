"use client";

import { motion } from "framer-motion";
import { STYLE_DNA } from "@/lib/demo-data";
import { StyleDNAMatrix } from "@/components/nio/StyleDNAMatrix";
import { phaseTransition } from "./shared";

export function PactPhase({ onNext }: { onNext: () => void }) {
  return (
    <motion.div key="pact" {...phaseTransition} className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="mb-6 text-2xl font-light">The Pact</h2>
        <p className="mb-8 text-[var(--fg-secondary)]">Will you nurture the stories that choose you?</p>
        <button
          onClick={onNext}
          className="rounded-full border border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.1)] px-10 py-4 text-sm font-medium uppercase tracking-[0.3em] transition hover:bg-[rgba(139,92,246,0.2)]"
        >
          I will
        </button>
      </div>
      <StyleDNAMatrix data={STYLE_DNA} />
    </motion.div>
  );
}
