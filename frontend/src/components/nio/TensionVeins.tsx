"use client";

import { motion } from "framer-motion";

type TensionNode = { id: string; label: string; heat: number; x: number; y: number };

export function TensionVeins({ nodes }: { nodes: TensionNode[] }) {
  return (
    <div className="relative h-32 w-full overflow-hidden rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(10,7,16,0.8)]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="veinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139,92,246,0.3)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0.6)" />
          </linearGradient>
        </defs>
        {nodes.slice(0, 5).map((n, i) => {
          const next = nodes[i + 1];
          if (!next) return null;
          return (
            <motion.line
              key={`vein-${n.id}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.5 + n.heat * 0.4 }}
              transition={{ delay: i * 0.1 }}
              x1={n.x}
              y1={n.y}
              x2={next.x}
              y2={next.y}
              stroke="url(#veinGrad)"
              strokeWidth={2 + n.heat * 2}
            />
          );
        })}
        {nodes.map((n, i) => (
          <motion.circle
            key={n.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            cx={n.x}
            cy={n.y}
            r={4 + n.heat * 4}
            fill="rgba(244,114,182,0.6)"
            className="drop-shadow-lg"
          />
        ))}
      </svg>
    </div>
  );
}
