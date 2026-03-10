"use client";

import { motion } from "framer-motion";

type Seed = { character: string; conflict: string; change: string };

const BURST_ORBITS = 12;
const NODES_PER_ORBIT = [3, 6, 9, 12];

export function GenesisBurst({ seed }: { seed: Seed }) {
  const labels = [
    seed.character || "Character",
    seed.conflict || "Conflict",
    seed.change || "Change",
    "Archetype",
    "Scene",
    "Tone",
    "Symbol",
    "Theme",
    "Echo",
    "Foreshadow",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative flex h-48 w-48 items-center justify-center"
    >
      <svg viewBox="-100 -100 200 200" className="absolute h-full w-full">
        {NODES_PER_ORBIT.map((count, orbitIdx) => {
          const r = 25 + orbitIdx * 28;
          return Array.from({ length: count }).map((_, i) => {
            const angle = (360 / count) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * r;
            const y = Math.sin(rad) * r;
            const label = labels[(orbitIdx * 3 + i) % labels.length];
            return (
              <motion.g
                key={`${orbitIdx}-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: orbitIdx * 0.1 + i * 0.04 }}
              >
                <line
                  x1={0}
                  y1={0}
                  x2={x}
                  y2={y}
                  stroke="rgba(139,92,246,0.3)"
                  strokeWidth={0.5}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="rgba(192,132,252,0.8)"
                  className="animate-pulse"
                  style={{ filter: "drop-shadow(0 0 4px rgba(139,92,246,0.6))" }}
                />
              </motion.g>
            );
          });
        })}
      </svg>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute h-4 w-4 rounded-full bg-[rgba(139,92,246,0.9)] shadow-[0_0_20px_rgba(139,92,246,0.8)]"
      />
    </motion.div>
  );
}
