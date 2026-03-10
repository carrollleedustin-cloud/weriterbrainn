"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { dimensionRegistry } from "@/lib/dimension-registry";

export function LandingDimensions() {
  const dimensions = dimensionRegistry
    .getAll()
    .filter((d) => d.showInDimensionNav && d.id !== "ascend");

  return (
    <section className="border-t border-[rgba(139,92,246,0.12)] px-8 py-24">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center text-sm uppercase tracking-[0.4em] text-[rgba(139,92,246,0.9)]"
      >
        The dimensions
      </motion.h2>
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dimensions.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <Link
              href={item.href}
              className="group block rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(10,7,16,0.6)] p-6 backdrop-blur-sm transition-all hover:border-[rgba(139,92,246,0.4)] hover:shadow-[0_0_24px_rgba(139,92,246,0.1)]"
            >
              <div className="flex items-center gap-2">
                {item.glyph && <span className="text-lg text-[rgba(139,92,246,0.6)]">{item.glyph}</span>}
                <p className="font-medium text-[var(--fg-primary)] transition-colors group-hover:text-white">{item.label}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{item.description}</p>
              <span className="mt-3 inline-block text-xs text-[rgba(139,92,246,0.7)] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5">
                Enter →
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
