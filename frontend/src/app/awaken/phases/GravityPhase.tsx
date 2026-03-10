"use client";

import { motion } from "framer-motion";
import { GRAVITY_OPTIONS } from "@/lib/demo-data";
import { phaseTransition } from "./shared";

interface Props {
  gravity: Record<string, number>;
  onGravityChange: (patch: Record<string, number>) => void;
  onNext: () => void;
}

export function GravityPhase({ gravity, onGravityChange, onNext }: Props) {
  return (
    <motion.div key="gravity" {...phaseTransition} className="w-full max-w-2xl space-y-8">
      <h2 className="text-center text-xl font-light">Story Gravity Calibration</h2>
      <p className="text-center text-sm text-[var(--fg-muted)]">
        Orbit dials. Pulse rings. Calibrate your narrative field.
      </p>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {GRAVITY_OPTIONS.map((g) => {
          const val = (gravity[g.id] ?? g.value) as number;
          return (
            <div key={g.id} className="flex flex-col items-center gap-2">
              <div
                className="orbit-dial relative h-20 w-20 rounded-full border-2 border-[rgba(139,92,246,0.5)]"
                style={{
                  background: `conic-gradient(rgba(139,92,246,0.8) 0% ${val * 100}%, rgba(139,92,246,0.15) ${val * 100}% 100%)`,
                }}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val * 100}
                  onChange={(e) => onGravityChange({ [g.id]: parseInt(e.target.value, 10) / 100 })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-[var(--fg-primary)]">
                  {Math.round(val * 100)}
                </span>
              </div>
              <label className="text-center text-[10px] text-[var(--fg-muted)]">{g.label}</label>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="rounded-full border border-[rgba(139,92,246,0.5)] px-8 py-3 text-sm uppercase tracking-[0.3em] hover:bg-[rgba(139,92,246,0.1)]"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
