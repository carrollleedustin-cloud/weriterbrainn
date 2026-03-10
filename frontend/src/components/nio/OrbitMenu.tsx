"use client";

import { motion } from "framer-motion";
import Link from "next/link";

type OrbitAction = { label: string; href?: string; onClick?: () => void };

export function OrbitMenu({
  open,
  onClose,
  actions,
  anchor,
}: {
  open: boolean;
  onClose: () => void;
  actions: OrbitAction[];
  anchor: { x: number; y: number };
}) {
  if (!open || actions.length === 0) return null;

  const radius = 72;
  const count = actions.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="pointer-events-auto fixed z-50"
      style={{ left: anchor.x, top: anchor.y, transform: "translate(-50%, -50%)" }}
    >
      <div className="relative h-[160px] w-[160px]">
        {actions.map((a, i) => {
          const angle = (-90 + (360 / count) * i) * (Math.PI / 180);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const content = (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="inline-flex items-center justify-center rounded-full border border-[rgba(139,92,246,0.5)] bg-[rgba(19,16,28,0.95)] px-3 py-1.5 text-xs font-medium text-[var(--fg-primary)] shadow-lg backdrop-blur-sm transition hover:border-[rgba(139,92,246,0.9)] hover:shadow-[0_0_16px_rgba(139,92,246,0.4)]"
            >
              {a.label}
            </motion.span>
          );
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
            >
              {a.href ? (
                <Link href={a.href} onClick={onClose}>
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={() => { a.onClick?.(); onClose(); }}>
                  {content}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
