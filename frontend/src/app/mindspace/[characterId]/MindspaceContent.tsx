"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DEMO_ENTITIES } from "@/lib/demo-data";

export function MindspaceContent({ characterId }: { characterId: string }) {
  const character = DEMO_ENTITIES.find((e) => e.id === characterId && e.type === "character");

  if (!character) {
    return (
      <div className="space-y-6">
        <p className="text-[var(--fg-muted)]">Character not found.</p>
        <Link href="/cast" className="text-sm text-[rgba(139,92,246,0.9)] hover:underline">
          ← Cast
        </Link>
      </div>
    );
  }

  const nodes = [
    { id: "desire", label: "Desire", value: 0.85 },
    { id: "fear", label: "Fear", value: 0.9 },
    { id: "secret", label: "Secret", value: 0.7 },
    { id: "loyalty", label: "Loyalty", value: 0.6 },
    { id: "breaking", label: "Breaking point", value: 0.75 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
          Character Mindspace
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fg-primary)] sm:text-3xl">
          <span className="gradient-text">{character.name}</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--fg-secondary)]">{character.summary}</p>
      </div>

      <div className="cosmos-card rounded-xl p-6">
        <h3 className="section-label mb-4 text-xs font-medium uppercase tracking-wide">
          Psychological topography
        </h3>
        <div className="space-y-4">
          {nodes.map((n, i) => (
            <div key={n.id}>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--fg-secondary)]">{n.label}</span>
                <span>{Math.round(n.value * 100)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgba(139,92,246,0.2)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${n.value * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="h-full rounded-full bg-[rgba(139,92,246,0.7)]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link href="/cast" className="inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
        ← Cast
      </Link>
    </div>
  );
}
