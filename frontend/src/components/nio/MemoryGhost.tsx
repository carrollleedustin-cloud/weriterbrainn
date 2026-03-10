"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MemoryGhost({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-lg border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label && (
              <span className="absolute -top-5 left-2 text-[9px] uppercase tracking-wider text-[rgba(192,132,252,0.7)]">
                {label}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
