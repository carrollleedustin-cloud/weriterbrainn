"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useNarrativeStore } from "@/store/narrative";
import { useNarrativeInit } from "@/hooks/useNarrative";
import { PhaseShiftPanel } from "@/components/nio/PhaseShiftPanel";
import { DimensionHeader } from "@/components/nio/DimensionHeader";

const ZONE_META: Record<string, { color: string; glow: string; label: string; advisory: string }> = {
  cold:       { color: "rgba(148,163,184,0.5)", glow: "rgba(148,163,184,0.15)", label: "Cold Front",       advisory: "Narrative energy insufficient — inject conflict or revelation." },
  overloaded: { color: "rgba(244,63,94,0.7)",   glow: "rgba(244,63,94,0.2)",   label: "Overloaded Storm",  advisory: "Too many simultaneous tensions. Stagger or relieve one thread." },
  climax:     { color: "rgba(251,191,36,0.7)",   glow: "rgba(251,191,36,0.2)",  label: "Climax Front",      advisory: "Peak energy. All converging threads must resolve or pivot." },
  dead:       { color: "rgba(100,116,139,0.5)",  glow: "rgba(100,116,139,0.1)", label: "Dead Zone",         advisory: "No active tension. Risk of reader disengagement. Create disturbance." },
  fault:      { color: "rgba(248,113,113,0.6)",  glow: "rgba(248,113,113,0.18)",label: "Fault Line",        advisory: "Structural weakness detected. Continuity or logic issue brewing." },
};

function getZone(type: string) {
  return ZONE_META[type] ?? { color: "rgba(139,92,246,0.5)", glow: "rgba(139,92,246,0.1)", label: type, advisory: "Zone analysis pending." };
}

export default function PressureMapPage() {
  useNarrativeInit();
  const pressureZones = useNarrativeStore((s) => s.pressureZones);
  const health = useNarrativeStore((s) => s.health);
  const threads = useNarrativeStore((s) => s.threads);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "bar">("grid");

  const selected = pressureZones.find((z) => z.id === selectedId);

  const systemPressure = useMemo(
    () => pressureZones.length ? pressureZones.reduce((s, z) => s + z.intensity, 0) / pressureZones.length : 0,
    [pressureZones]
  );

  const typeDistribution = useMemo(() => {
    const m: Record<string, number> = {};
    for (const z of pressureZones) m[z.type] = (m[z.type] ?? 0) + 1;
    return m;
  }, [pressureZones]);

  return (
    <div className="space-y-8">
      <DimensionHeader
        title={<>Pressure <span className="gradient-text">Map</span></>}
        subtitle="Weather system for narrative instability. Cold zones, overloaded storms, climax fronts."
        stats={
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">System pressure</span>
              <span className={`text-lg font-semibold ${systemPressure > 0.7 ? "text-rose-400" : systemPressure > 0.4 ? "text-amber-400" : "text-[var(--fg-primary)]"}`}>
                {Math.round(systemPressure * 100)}%
              </span>
            </div>
            <div className="flex rounded-full border border-[rgba(139,92,246,0.3)] p-0.5">
              <button type="button" onClick={() => setViewMode("grid")} className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${viewMode === "grid" ? "bg-[rgba(139,92,246,0.3)] text-[var(--fg-primary)]" : "text-[var(--fg-muted)]"}`}>Grid</button>
              <button type="button" onClick={() => setViewMode("bar")} className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${viewMode === "bar" ? "bg-[rgba(139,92,246,0.3)] text-[var(--fg-primary)]" : "text-[var(--fg-muted)]"}`}>Bar</button>
            </div>
          </div>
        }
      />

      <div className="cosmos-card rounded-xl p-4">
        <h3 className="section-label mb-3 text-xs font-medium uppercase tracking-wide">Weather summary</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(typeDistribution).map(([type, count]) => {
            const meta = getZone(type);
            return (
              <div key={type} className="flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: meta.color, background: meta.glow }}>
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
                <span className="text-[10px] text-[var(--fg-muted)]">×{count}</span>
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-2 text-[10px] text-[var(--fg-muted)]">
            <span>Tension load: {Math.round(health.tensionLoad * 100)}%</span>
            <span>·</span>
            <span>{threads.length} threads</span>
          </div>
        </div>
      </div>

      <div className="cosmos-card rounded-xl p-6">
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pressureZones.map((z, i) => {
                const meta = getZone(z.type);
                return (
                  <motion.button
                    type="button"
                    key={z.id}
                    onClick={() => { setSelectedId(z.id); setPanelOpen(true); }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="group relative overflow-hidden rounded-lg border p-4 text-left transition-all hover:shadow-[0_0_20px_var(--glow)]"
                    style={{
                      borderColor: meta.color + "40",
                      background: meta.glow,
                      "--glow": meta.glow,
                    } as React.CSSProperties}
                  >
                    <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `radial-gradient(circle at 50% 50%, ${meta.glow}, transparent 70%)` }} />
                    <div className="relative">
                      <p className="text-sm font-medium text-[var(--fg-primary)]">{z.label}</p>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>{meta.label}</p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${z.intensity * 100}%` }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                        />
                      </div>
                      <p className="mt-1 text-right text-[10px] font-medium" style={{ color: meta.color }}>{Math.round(z.intensity * 100)}%</p>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[...pressureZones].sort((a, b) => b.intensity - a.intensity).map((z, i) => {
                const meta = getZone(z.type);
                return (
                  <motion.div
                    key={z.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Zone: ${z.label}`}
                    onClick={() => { setSelectedId(z.id); setPanelOpen(true); }}
                    onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelectedId(z.id); setPanelOpen(true); }}}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[rgba(139,92,246,0.15)] bg-[rgba(19,16,28,0.4)] px-3 py-2 transition-all hover:border-[rgba(139,92,246,0.4)]"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="w-24 text-xs text-[var(--fg-primary)]">{z.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${z.intensity * 100}%` }}
                        transition={{ delay: 0.1 + i * 0.04 }}
                        className="h-full rounded-full"
                        style={{ background: meta.color }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium" style={{ color: meta.color }}>{Math.round(z.intensity * 100)}%</span>
                    <span className="text-[10px] uppercase" style={{ color: meta.color }}>{z.type}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PhaseShiftPanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Zone Analysis">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: getZone(selected.type).color }} />
              <span className="text-sm font-medium text-[var(--fg-primary)]">{selected.label}</span>
              <span className="text-[10px] uppercase" style={{ color: getZone(selected.type).color }}>{getZone(selected.type).label}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/20">
              <div className="h-full rounded-full" style={{ background: getZone(selected.type).color, width: `${selected.intensity * 100}%` }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Intensity</p>
              <p className="text-2xl font-semibold" style={{ color: getZone(selected.type).color }}>{Math.round(selected.intensity * 100)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Weather advisory</p>
              <p className="text-sm text-[var(--fg-secondary)]">{getZone(selected.type).advisory}</p>
            </div>
            <div className="rounded-lg border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.05)] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Structural recommendation</p>
              <p className="text-sm text-[var(--fg-secondary)]">
                {selected.intensity > 0.8
                  ? "Critical pressure. Immediate structural intervention recommended — relieve tension or commit to climax."
                  : selected.intensity > 0.5
                    ? "Elevated. Monitor closely. One additional complication could push into overload territory."
                    : "Stable. Safe zone for seeding new conflict or deepening existing threads."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[var(--fg-muted)]">Select a zone to analyze.</p>
        )}
      </PhaseShiftPanel>

      <Link href="/nexus" className="inline-block text-xs text-[rgba(139,92,246,0.9)] hover:underline">
        ← Origin Nexus
      </Link>
    </div>
  );
}
