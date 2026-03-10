"use client";

import { motion } from "framer-motion";

type RippleNode = { id: string; label: string; affected?: string[] };

export function CausalityRipples({
  source,
  propagations,
}: {
  source: string;
  propagations: RippleNode[];
}) {
  return (
    <div className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(10,7,16,0.8)] p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
        Causality propagation
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--fg-primary)]">Edit: {source}</p>
      <div className="mt-3 space-y-2">
        {propagations.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="flex items-center gap-2 text-xs"
          >
            <span className="h-1 w-1 rounded-full bg-[rgba(139,92,246,0.8)]" />
            <span className="text-[var(--fg-secondary)]">{p.label}</span>
            {p.affected && p.affected.length > 0 && (
              <span className="text-[var(--fg-muted)]">
                → {p.affected.slice(0, 2).join(", ")}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
