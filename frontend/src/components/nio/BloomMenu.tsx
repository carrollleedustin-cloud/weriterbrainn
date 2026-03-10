"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { dimensionRegistry } from "@/lib/dimension-registry";

const RADIUS = 140;
const CENTER = { x: 0, y: 0 };

function polarToCartesian(angle: number, r: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

function bezierToCenter(cx: number, cy: number, x: number, y: number, curvature: number) {
  const mx = (cx + x) / 2;
  const my = (cy + y) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const perpX = -dy * curvature;
  const perpY = dx * curvature;
  const cpx = mx + perpX;
  const cpy = my + perpY;
  return `M ${cx} ${cy} Q ${cpx} ${cpy} ${x} ${y}`;
}

export function BloomMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const items = dimensionRegistry.getAll();
  const count = items.length;
  const baseAngle = -90;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[rgba(2,1,8,0.85)] backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
          >
            <svg
              viewBox="-180 -180 360 360"
              className="h-[360px] w-[360px] drop-shadow-[0_0_60px_rgba(139,92,246,0.25)]"
            >
              {items.map((_, i) => {
                const a1 = baseAngle + (360 / count) * i;
                const a2 = baseAngle + (360 / count) * (i + 1);
                const m1 = polarToCartesian((a1 + a2) / 2, RADIUS * 0.4);
                const m2 = polarToCartesian((a1 + a2) / 2 + 8, RADIUS * 0.55);
                const d = `M ${m1.x} ${m1.y} Q ${(m1.x + m2.x) / 2 + 12} ${(m1.y + m2.y) / 2 - 8} ${m2.x} ${m2.y}`;
                return (
                  <motion.path
                    key={`vessel-${i}`}
                    d={d}
                    fill="none"
                    stroke="rgba(139,92,246,0.12)"
                    strokeWidth={0.8}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.02, duration: 0.5 }}
                  />
                );
              })}
              {items.map((dim, i) => {
                const angle = baseAngle + (360 / count) * i;
                const pos = polarToCartesian(angle, RADIUS);
                const isHovered = hovered === dim.id;
                const pathD = bezierToCenter(CENTER.x, CENTER.y, pos.x, pos.y, 0.15 + (i % 3) * 0.05);
                return (
                  <g key={dim.id}>
                    <motion.path
                      d={pathD}
                      fill="none"
                      stroke={isHovered ? "rgba(192,132,252,0.7)" : "rgba(139,92,246,0.4)"}
                      strokeWidth={isHovered ? 2 : 1}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: i * 0.025, duration: 0.4 }}
                      style={{ filter: isHovered ? "drop-shadow(0 0 4px rgba(192,132,252,0.6))" : undefined }}
                    />
                    <foreignObject
                      x={pos.x - 52}
                      y={pos.y - 14}
                      width={104}
                      height={28}
                      style={{ overflow: "visible" }}
                    >
                      <Link
                        href={dim.href}
                        onMouseEnter={() => setHovered(dim.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={onClose}
                        className="block rounded-full border border-[rgba(139,92,246,0.4)] bg-[rgba(10,7,16,0.95)] px-4 py-2 text-center text-sm font-medium text-[var(--fg-primary)] shadow-lg transition hover:border-[rgba(139,92,246,0.8)] hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]"
                        title={dim.description}
                      >
                        {dim.glyph && <span className="mr-1 opacity-60">{dim.glyph}</span>}
                        {dim.label}
                      </Link>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
              Shift dimensions
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
