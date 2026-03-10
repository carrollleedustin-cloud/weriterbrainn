"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GravityWellAction } from "@/components/nio/GravityWellAction";

export function LandingHero() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
        className="max-w-4xl space-y-8"
      >
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-xs uppercase tracking-[0.4em] text-[rgba(139,92,246,0.9)]"
        >
          Narrative Intelligence Operating System
        </motion.p>
        <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight sm:text-7xl">
          Stop writing documents.
          <br />
          <span className="gradient-text">Start engineering universes.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--fg-secondary)]">
          The first operating system for narrative intelligence. Your story is not a draft.
          It is a living system of memory, causality, tension, and consequence.
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="pt-4"
        >
          <GravityWellAction strength={0.12} radius={180}>
            <Link
              href="/awaken"
              className="group inline-flex items-center gap-3 rounded-full border-2 border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.08)] px-10 py-4 text-base font-medium text-white transition hover:border-[rgba(139,92,246,0.9)] hover:bg-[rgba(139,92,246,0.18)] hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
            >
              Awaken NIO-OS
              <span className="opacity-60 transition group-hover:opacity-100 group-hover:translate-x-0.5">→</span>
            </Link>
          </GravityWellAction>
        </motion.div>
      </motion.div>
    </main>
  );
}
