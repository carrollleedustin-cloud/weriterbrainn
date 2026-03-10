"use client";

import { motion } from "framer-motion";
import { DEMO_UNIVERSE } from "@/lib/demo-data";
import { phaseTransition } from "./shared";

interface Props {
  igniting: boolean;
  seed: { character: string; conflict: string; change: string };
  intelligenceMode: string;
  onIgnite: () => void;
}

export function IgnitionPhase({ igniting, seed, intelligenceMode, onIgnite }: Props) {
  return (
    <motion.div key="ignition" {...phaseTransition} className="text-center">
      {igniting ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          <div className="relative mx-auto h-32 w-32">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.15)]"
            />
            <motion.div
              animate={{ scale: [1.1, 0.95, 1.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-4 rounded-full border border-[rgba(192,132,252,0.5)] bg-[rgba(192,132,252,0.1)]"
            />
            <motion.div
              animate={{ scale: [0.9, 1.2, 0.9] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-8 rounded-full bg-[rgba(192,132,252,0.3)] shadow-[0_0_40px_rgba(192,132,252,0.5)]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-12 rounded-full bg-white/20 shadow-[0_0_60px_rgba(255,255,255,0.3)]"
            />
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-light"
          >
            Universe Igniting
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-2">
            <p className="text-[var(--fg-secondary)]">
              Threads awaken. Nodes align. Narrative structures self-organize.
            </p>
            <p className="text-sm font-medium gradient-text">{DEMO_UNIVERSE.name}</p>
          </motion.div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          <h2 className="text-2xl font-light">Universe Ignition</h2>
          <p className="text-[var(--fg-secondary)]">
            The field deepens. All calibrations are set. Prepare to cross.
          </p>
          <div className="mx-auto flex max-w-sm flex-wrap justify-center gap-2">
            {seed.character && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{seed.character}</span>
            )}
            {seed.conflict && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-xs text-rose-300">{seed.conflict}</span>
            )}
            {seed.change && (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">{seed.change}</span>
            )}
            {intelligenceMode && (
              <span className="rounded-full border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.1)] px-2 py-0.5 text-xs text-[rgba(192,132,252,0.9)]">{intelligenceMode}</span>
            )}
          </div>
          <button
            onClick={onIgnite}
            className="animate-nio-resonate rounded-full border-2 border-[rgba(139,92,246,0.7)] bg-[rgba(139,92,246,0.15)] px-12 py-4 text-base font-medium transition hover:bg-[rgba(139,92,246,0.25)] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
          >
            Ignite
          </button>
        </div>
      )}
    </motion.div>
  );
}
