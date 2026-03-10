"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const TIERS = [
  {
    id: "observer",
    name: "Observer",
    tagline: "Witness the Cosmos",
    desc: "1 active universe. Limited word count. Basic Story Cosmos. Demo previews of deeper systems.",
  },
  {
    id: "weaver",
    name: "Weaver",
    tagline: "Shape the Threads",
    desc: "Unlimited scenes. Loom of Fate. Style DNA capture. Continuity intelligence. Active thread management.",
  },
  {
    id: "architect",
    name: "Architect",
    tagline: "Design Universes",
    desc: "Multiverse branching. Character Mindspace. Simulation Chamber. Pressure Map. Advanced causality.",
    featured: true,
  },
  {
    id: "oracle",
    name: "Oracle",
    tagline: "See What Stories Become",
    desc: "Predictive reader-response. Emotional debt tracking. Scene gravity scoring. Dreamscape access.",
  },
  {
    id: "sovereign",
    name: "Sovereign",
    tagline: "Command Worlds at Scale",
    desc: "Collaborative universes. Role-based workflows. Cross-project continuity. Franchise lore infrastructure.",
  },
];

export default function AscendPage() {
  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
          Ascension
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tiers of <span className="gradient-text">Creative Consciousness</span>
        </h1>
        <p className="max-w-2xl text-sm text-[var(--fg-secondary)]">
          Not billing plans. Access to deeper levels of narrative intelligence. Higher consciousness,
          productized.
        </p>
      </motion.div>

      <div className="space-y-6">
        {TIERS.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`relative overflow-hidden rounded-xl border p-6 transition ${
              t.featured
                ? "border-[rgba(139,92,246,0.5)] bg-[linear-gradient(135deg,rgba(139,92,246,0.08),rgba(139,92,246,0.02))]"
                : "border-[rgba(139,92,246,0.25)] bg-[rgba(19,16,28,0.6)]"
            }`}
          >
            {t.featured && (
              <div className="absolute right-6 top-6 text-[10px] uppercase tracking-widest text-[rgba(139,92,246,0.8)]">
                Recommended
              </div>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
                  {t.name}
                </p>
                <h2 className="mt-1 text-xl font-medium text-[var(--fg-primary)]">{t.tagline}</h2>
                <p className="mt-3 max-w-2xl text-sm text-[var(--fg-secondary)]">{t.desc}</p>
              </div>
              <Link
                href={t.featured ? "/register" : "/nexus"}
                className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition ${
                  t.featured
                    ? "border-2 border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.15)] text-white hover:bg-[rgba(139,92,246,0.25)]"
                    : "border border-[rgba(139,92,246,0.35)] text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.1)] hover:text-[var(--fg-primary)]"
                }`}
              >
                {t.featured ? "Ascend" : "Learn more"}
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(10,7,16,0.6)] p-6"
      >
        <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">
          Invite-only
        </p>
        <h3 className="mt-1 text-lg font-medium text-[var(--fg-primary)]">Pantheon</h3>
        <p className="mt-2 text-sm text-[var(--fg-secondary)]">
          Access to forbidden machinery. Experimental systems. Founding mythic status.
        </p>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Apply when the time is right.</p>
      </motion.div>
    </div>
  );
}
