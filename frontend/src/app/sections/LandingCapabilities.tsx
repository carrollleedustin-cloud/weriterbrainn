"use client";

import { motion } from "framer-motion";

const CAPABILITIES = [
  "Contradiction detection · unresolved conflict warnings",
  "Secret exposure forecasting · scene gravity scoring",
  "Emotional debt tracking · thread stagnation detection",
  "Thematic resonance analysis · timeline fracture alerts",
  "Reader confusion prediction · causality propagation",
  "Character voice drift detection · out-of-character alerts",
];

export function LandingCapabilities() {
  return (
    <section className="border-t border-[rgba(139,92,246,0.12)] px-8 py-24">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4 text-center text-2xl font-light tracking-tight sm:text-3xl"
      >
        See the story think back.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center text-sm text-[var(--fg-muted)]"
      >
        Capabilities that should not exist yet.
      </motion.p>
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
        {CAPABILITIES.map((line, i) => (
          <motion.div
            key={line}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            className="flex items-center gap-3 rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(10,7,16,0.4)] px-4 py-3 transition-all hover:border-[rgba(139,92,246,0.35)] hover:shadow-[0_0_12px_rgba(139,92,246,0.06)]"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[rgba(139,92,246,0.8)] shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
            <span className="text-sm text-[var(--fg-secondary)]">{line}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
