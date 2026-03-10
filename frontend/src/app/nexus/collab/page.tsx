"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { DimensionHeader } from "@/components/nio/DimensionHeader";
import {
  COLLAB_COLLABORATORS as DEMO_COLLABORATORS,
  COLLAB_LORE_CONFLICTS as DEMO_LORE_CONFLICTS,
  COLLAB_ROLE_PERMISSIONS as ROLE_PERMISSIONS,
  type Collaborator,
} from "@/lib/demo-service";

function presenceLabel(ms: number): string {
  if (ms === 0) return "Now";
  if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
  return `${Math.round(ms / 3600000)}h ago`;
}

function severityColor(s: string): string {
  if (s === "high") return "rgba(244,63,94,0.8)";
  if (s === "medium") return "rgba(251,191,36,0.8)";
  return "rgba(148,163,184,0.6)";
}

export default function NexusCollabPage() {
  useNarrativeInit();
  const universe = useNarrativeStore((s) => s.universe);
  const threads = useNarrativeStore((s) => s.threads);
  const characters = useNarrativeStore((s) => s.characters);
  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<"presence" | "lore" | "roles">("presence");

  const activeCount = DEMO_COLLABORATORS.filter((c) => c.presenceMs < 600000).length;

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<><span className="gradient-text">Nexus</span> Collaborative</>}
        subtitle="Multi-author universe. Role-based workflows. Cross-project continuity. Lore integrity."
        tier="Sovereign Tier"
        stats={
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{activeCount} active</span>
            <div className="flex -space-x-1.5">
              {DEMO_COLLABORATORS.filter((c) => c.presenceMs < 600000).map((c) => (
                <div key={c.id} className="h-5 w-5 rounded-full border-2 border-[rgba(10,7,16,0.9)]" style={{ background: c.color }} title={c.name} />
              ))}
            </div>
          </div>
        }
      />

      <div className="flex rounded-full border border-[rgba(139,92,246,0.3)] p-0.5">
        {(["presence", "lore", "roles"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-wider transition ${
              tab === t
                ? "bg-[rgba(139,92,246,0.25)] text-[var(--fg-primary)]"
                : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
            }`}
          >
            {t === "presence" ? "Live presence" : t === "lore" ? "Lore conflicts" : "Roles & Access"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "presence" && (
          <motion.div key="presence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {DEMO_COLLABORATORS.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                role="button"
                tabIndex={0}
                aria-label={`Collaborator: ${c.name}`}
                onClick={() => { setSelectedCollab(c); setPanelOpen(true); }}
                onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelectedCollab(c); setPanelOpen(true); }}}
                className="cosmos-card flex cursor-pointer items-center gap-4 rounded-xl p-4 transition-all hover:border-[rgba(139,92,246,0.5)]"
              >
                <div className="relative">
                  <div className="h-8 w-8 rounded-full" style={{ background: c.color }} />
                  {c.presenceMs < 60000 && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[rgba(10,7,16,0.9)] bg-emerald-400 animate-nio-pulse" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--fg-primary)]">{c.name}</span>
                    <span className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-[9px] uppercase text-[var(--fg-muted)]">{c.role}</span>
                  </div>
                  <p className="text-xs text-[var(--fg-muted)]">{c.lastAction}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--fg-muted)]">{c.activeRegion}</p>
                  <p className="text-[10px]" style={{ color: c.presenceMs < 60000 ? "rgba(52,211,153,0.8)" : "var(--fg-muted)" }}>
                    {presenceLabel(c.presenceMs)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === "lore" && (
          <motion.div key="lore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="cosmos-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-label text-xs font-medium uppercase tracking-wide">Continuity integrity</h3>
                <span className="text-[10px] text-[var(--fg-muted)]">{DEMO_LORE_CONFLICTS.length} conflicts detected</span>
              </div>
              {DEMO_LORE_CONFLICTS.map((lc, i) => (
                <motion.div
                  key={lc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="mb-2 last:mb-0 rounded-lg border p-3"
                  style={{ borderColor: severityColor(lc.severity) + "40", background: severityColor(lc.severity).replace(/[\d.]+\)$/, "0.06)") }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-[var(--fg-primary)]">{lc.description}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase font-medium" style={{ color: severityColor(lc.severity), background: severityColor(lc.severity).replace(/[\d.]+\)$/, "0.15)") }}>
                      {lc.severity}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {lc.authors.map((a) => {
                      const collab = DEMO_COLLABORATORS.find((c) => c.name === a);
                      return (
                        <span key={a} className="rounded-full border border-[rgba(139,92,246,0.3)] px-2 py-0.5 text-[10px]" style={{ color: collab?.color ?? "var(--fg-muted)" }}>
                          {a}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "roles" && (
          <motion.div key="roles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {Object.entries(ROLE_PERMISSIONS).map(([role, perms], i) => (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="cosmos-card rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-[var(--fg-primary)]">{role}</span>
                  <span className="text-[10px] text-[var(--fg-muted)]">
                    {DEMO_COLLABORATORS.filter((c) => c.role === role).length} member{DEMO_COLLABORATORS.filter((c) => c.role === role).length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <span key={p} className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-2 py-0.5 text-[10px] text-[var(--fg-muted)]">{p}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <PhaseShiftPanel open={panelOpen} onClose={() => setPanelOpen(false)} title={selectedCollab?.name ?? "Collaborator"}>
        {selectedCollab ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full" style={{ background: selectedCollab.color }} />
              <div>
                <p className="text-sm font-medium text-[var(--fg-primary)]">{selectedCollab.name}</p>
                <p className="text-xs text-[var(--fg-muted)]">{selectedCollab.role}</p>
              </div>
              <span className="ml-auto text-[10px]" style={{ color: selectedCollab.presenceMs < 60000 ? "rgba(52,211,153,0.8)" : "var(--fg-muted)" }}>
                {presenceLabel(selectedCollab.presenceMs)}
              </span>
            </div>
            <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Current region</p>
              <p className="text-sm text-[var(--fg-primary)]">{selectedCollab.activeRegion}</p>
            </div>
            <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Last action</p>
              <p className="text-sm text-[var(--fg-secondary)]">{selectedCollab.lastAction}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {(ROLE_PERMISSIONS[selectedCollab.role] ?? []).map((p) => (
                  <span key={p} className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-2 py-0.5 text-[10px] text-[var(--fg-muted)]">{p}</span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </PhaseShiftPanel>

      <div className="rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-4">
        <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Universe</p>
        <p className="mt-1 text-sm font-medium text-[var(--fg-primary)]">{universe.name}</p>
        <p className="mt-1 text-xs text-[var(--fg-muted)]">{threads.length} threads · {characters.length} characters</p>
      </div>

      <Link href="/nexus" className="inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
        ← Origin Nexus
      </Link>
    </div>
  );
}
