"use client";

import { motion } from "framer-motion";

type StyleDNAData = Record<string, number | string>;

export function StyleDNAMatrix({ data }: { data: StyleDNAData }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
  const numericEntries = entries.filter(([, v]) => typeof v === "number") as [string, number][];
  const stringEntries = entries.filter(([, v]) => typeof v === "string") as [string, string][];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.9)] p-6"
    >
      <p className="mb-4 text-[10px] uppercase tracking-[0.4em] text-[var(--fg-muted)]">
        Style DNA Matrix
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {numericEntries.map(([key, value], i) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-[var(--fg-muted)]">{formatKey(key)}</span>
              <span className="text-[var(--fg-primary)]">{Math.round(value * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(139,92,246,0.2)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value * 100}%` }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
                className="h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#c084fc)]"
              />
            </div>
          </div>
        ))}
        {stringEntries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-[rgba(139,92,246,0.2)] px-3 py-2">
            <p className="text-[10px] uppercase text-[var(--fg-muted)]">{formatKey(key)}</p>
            <p className="text-sm text-[var(--fg-primary)]">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.5)] to-transparent" />
        <span className="text-[10px] text-[var(--fg-muted)]">Living helix</span>
      </div>
    </motion.div>
  );
}

function formatKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
}
