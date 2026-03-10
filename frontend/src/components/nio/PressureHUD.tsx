"use client";

import { motion } from "framer-motion";

type PressureMetric = {
  id: string;
  label: string;
  value: number;
  max?: number;
  severity: "low" | "medium" | "high" | "critical";
};

const severityStyles = {
  low: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/20 text-amber-400",
  high: "bg-rose-500/20 text-rose-400",
  critical: "bg-rose-600/30 text-rose-300",
};

export function PressureHUD({ metrics }: { metrics: PressureMetric[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-3"
    >
      {metrics.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.2)] px-3 py-1.5 text-xs ${severityStyles[m.severity]}`}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
          <span className="font-medium">{m.label}</span>
          <span className="text-[var(--fg-muted)]">
            {m.max ? `${Math.round((m.value / m.max) * 100)}%` : m.value}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
