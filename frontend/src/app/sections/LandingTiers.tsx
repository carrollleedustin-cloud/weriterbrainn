"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const TIERS = [
  { tier: "Observer", tag: "Witness the Cosmos", limit: "1 universe · limited dimensions", featured: false },
  { tier: "Weaver", tag: "Shape the Threads", limit: "Loom · Style DNA · continuity", featured: false },
  { tier: "Architect", tag: "Design Universes", limit: "Mindspace · Simulation · Pressure", featured: true },
  { tier: "Oracle", tag: "See What Stories Become", limit: "Predictive · collapse forecasting · Dreamscape", featured: false },
];

export function LandingTiers() {
  return (
    <section className="border-t border-[rgba(139,92,246,0.15)] px-8 py-24">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4 text-center text-xs uppercase tracking-[0.5em] text-[var(--fg-muted)]"
      >
        Ascension
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-16 text-center text-sm text-[var(--fg-secondary)]"
      >
        Tiers of creative consciousness — not billing plans.
      </motion.p>
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t, i) => (
          <Link key={t.tier} href="/ascend">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`rounded-xl border p-6 transition-all hover:border-[rgba(139,92,246,0.4)] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] ${
                t.featured
                  ? "border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.06)] animate-nio-resonate"
                  : "border-[rgba(139,92,246,0.2)] bg-[rgba(10,7,16,0.5)]"
              }`}
            >
              <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)]">{t.tier}</p>
              <p className="mt-2 font-medium text-[var(--fg-primary)]">{t.tag}</p>
              <p className="mt-2 text-xs text-[var(--fg-muted)]">{t.limit}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
