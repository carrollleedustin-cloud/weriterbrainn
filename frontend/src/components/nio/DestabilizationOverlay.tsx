"use client";

import { motion } from "framer-motion";

export function DestabilizationOverlay({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="destabilization max-w-md rounded-xl border-2 border-rose-500/60 bg-rose-950/90 px-6 py-8 shadow-[0_0_60px_rgba(244,63,94,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-lg font-medium text-rose-200">{message}</p>
        <p className="mt-2 text-center text-sm text-rose-300/80">
          Narrative logic has fractured. Resolve to continue.
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="mx-auto mt-6 block rounded-full border border-rose-500/50 px-6 py-2 text-sm text-rose-200 hover:bg-rose-500/20"
          >
            Dismiss
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
