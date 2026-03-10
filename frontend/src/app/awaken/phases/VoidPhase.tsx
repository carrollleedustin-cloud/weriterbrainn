"use client";

import { motion } from "framer-motion";

export function VoidPhase({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      key="void"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 1.5 }}
      className="text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        className="mb-8 inline-block"
      >
        <div className="relative">
          <div className="h-3 w-3 rounded-full bg-[rgba(192,132,252,0.9)] shadow-[0_0_40px_rgba(192,132,252,0.6),0_0_80px_rgba(192,132,252,0.3)]" />
          <div className="absolute inset-0 h-3 w-3 animate-nio-resonate rounded-full" />
        </div>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="mb-6 text-sm uppercase tracking-[0.5em] text-[rgba(255,255,255,0.35)]"
      >
        The Awakening Chamber
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mb-8 text-4xl font-light tracking-tight sm:text-5xl"
      >
        Every universe begins as a singularity.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="mb-12 text-lg text-[var(--fg-secondary)]"
      >
        Are you here to witness stories — or to become their architect?
      </motion.p>
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.5 }}
        onClick={onNext}
        className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] text-white transition hover:border-[rgba(139,92,246,0.9)] hover:bg-[rgba(139,92,246,0.1)] hover:shadow-[0_0_24px_rgba(139,92,246,0.2)]"
      >
        Proceed
      </motion.button>
    </motion.div>
  );
}
