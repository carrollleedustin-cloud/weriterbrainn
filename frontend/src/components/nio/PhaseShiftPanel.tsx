"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PhaseShiftPanelProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function PhaseShiftPanel({ open, onClose, title, children }: PhaseShiftPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Detail panel"}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div
              className="relative overflow-hidden rounded-xl border border-[rgba(139,92,246,0.4)] bg-[linear-gradient(180deg,rgba(20,16,32,0.98),rgba(10,8,18,0.99))] shadow-[0_0_60px_rgba(139,92,246,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{
                boxShadow: "0 0 60px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-[rgba(139,92,246,0.6)] to-transparent" />
              {title && (
                <div className="flex items-center justify-between border-b border-[rgba(139,92,246,0.2)] px-6 py-4">
                  <h2 className="text-lg font-medium text-[var(--fg-primary)]">{title}</h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-[var(--fg-muted)] transition hover:bg-[rgba(139,92,246,0.15)] hover:text-[var(--fg-primary)]"
                    aria-label="Close panel"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
