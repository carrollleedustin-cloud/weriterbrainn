"use client";

import { motion } from "framer-motion";

type SecretItem = { id: string; name: string; exposureRisk: number };

export function SecretHeat({ secrets }: { secrets: SecretItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {secrets.map((s, i) => {
        const heat = s.exposureRisk;
        const hue = 330 - heat * 80;
        const glow = `0 0 12px hsla(${hue}, 70%, 60%, ${0.3 + heat * 0.4})`;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-full border px-3 py-1.5 text-xs"
            style={{
              borderColor: `hsla(${hue}, 60%, 50%, 0.5)`,
              background: `hsla(${hue}, 40%, 12%, 0.6)`,
              boxShadow: glow,
            }}
          >
            <span className="text-[var(--fg-primary)]">{s.name}</span>
            <span className="ml-2 text-[var(--fg-muted)]">
              {Math.round(heat * 100)}% exposure
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
