"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { StoryFieldCanvas } from "@/components/nio/StoryFieldCanvas";
import { GravityWellAction } from "@/components/nio/GravityWellAction";
import { GenesisBurst } from "@/components/nio/GenesisBurst";
import { StyleDNAMatrix } from "@/components/nio/StyleDNAMatrix";
import { PressureHUD } from "@/components/nio/PressureHUD";
import { useAuth } from "@/hooks/useAuth";
import { useAwakening } from "@/store/awakening";
import {
  DEMO_ENTITIES,
  DEMO_ORACLE,
  DEMO_THREADS,
  DEMO_UNIVERSE,
  STYLE_DNA,
} from "@/lib/demo-data";
import {
  PHASES,
  PHASE_LABELS,
  VoidPhase,
  QuestionPhase,
  MirrorPhase,
  SeedPhase,
  PactPhase,
  GravityPhase,
  IntelligencePhase,
  IgnitionPhase,
} from "./awaken/phases";

type Stage = "threshold" | "awakening" | "ignition" | "nexus";

export default function Threshold() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [stage, setStage] = useState<Stage>(() => (isAuthenticated ? "nexus" : "threshold"));
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [igniting, setIgniting] = useState(false);
  const {
    mirrorInput,
    setMirrorInput,
    mirrorChoice,
    setMirrorChoice,
    seed,
    setSeed,
    gravity,
    setGravity,
    intelligenceMode,
    setIntelligenceMode,
    setPhase,
    setUniverseName,
    setStyleDNA,
  } = useAwakening();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    setPhase(PHASES[phaseIndex]);
  }, [phaseIndex, setPhase]);

  useEffect(() => {
    if (stage === "ignition") {
      const toNexus = setTimeout(() => setStage("nexus"), 3600);
      return () => clearTimeout(toNexus);
    }
  }, [stage]);

  const currentPhase = PHASES[phaseIndex];

  const beginAwakening = () => {
    setStage("awakening");
    setPhaseIndex(0);
    setPhase("void");
  };

  const nextPhase = () => {
    if (phaseIndex >= PHASES.length - 1) {
      triggerIgnition();
      return;
    }
    setPhaseIndex((i) => i + 1);
  };

  const triggerIgnition = () => {
    setStage("ignition");
    setIgniting(true);
    setUniverseName(DEMO_UNIVERSE.name);
    setStyleDNA(STYLE_DNA);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#03020a]">
        <StoryFieldCanvas mouse={mouse} />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-nio-resonate rounded-full bg-[rgba(139,92,246,0.55)] shadow-[0_0_48px_rgba(139,92,246,0.45)]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#03020a]"
      data-cursor-mode={stage === "awakening" ? "weave" : "invoke"}
    >
      <StoryFieldCanvas mouse={mouse} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(124,58,237,0.18),transparent_55%),radial-gradient(ellipse_at_80%_40%,rgba(236,72,153,0.12),transparent_45%),radial-gradient(ellipse_at_20%_70%,rgba(34,197,94,0.12),transparent_45%)] opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05)_0%,transparent_35%,rgba(139,92,246,0.08)_60%,transparent_100%)] mix-blend-screen" />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {stage === "threshold" && (
            <ThresholdHero
              key="threshold"
              onBegin={beginAwakening}
              onPreview={() => setStage("nexus")}
              isAuthenticated={isAuthenticated}
            />
          )}

          {stage === "awakening" && (
            <AwakeningSequence
              key="awakening"
              currentPhase={currentPhase}
              phaseIndex={phaseIndex}
              mirrorInput={mirrorInput}
              mirrorChoice={mirrorChoice}
              seed={seed}
              gravity={gravity}
              intelligenceMode={intelligenceMode}
              onMirrorInputChange={setMirrorInput}
              onMirrorChoiceChange={setMirrorChoice}
              onSeedChange={setSeed}
              onGravityChange={setGravity}
              onModeChange={setIntelligenceMode}
              onNext={nextPhase}
            />
          )}

          {stage === "ignition" && (
            <IgnitionSequence
              key="ignition"
              seed={seed}
              intelligenceMode={intelligenceMode}
              igniting={igniting}
              onIgniteComplete={() => setStage("nexus")}
            />
          )}

          {stage === "nexus" && (
            <OriginNexusPreview
              key="nexus"
              universeName={DEMO_UNIVERSE.name}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ThresholdHero({
  onBegin,
  onPreview,
  isAuthenticated,
}: {
  onBegin: () => void;
  onPreview: () => void;
  isAuthenticated: boolean;
}) {
  const pressureMetrics = [
    { id: "tension", label: "Tension", value: Math.round(DEMO_UNIVERSE.tensionLoad * 100), max: 100, severity: "medium" as const },
    { id: "instability", label: "Instability", value: Math.round(DEMO_UNIVERSE.instability * 100), max: 100, severity: "low" as const },
    { id: "gravity", label: "Completion gravity", value: 72, max: 100, severity: "low" as const },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-12 px-6 py-16"
    >
      <div className="absolute inset-x-0 top-16 flex justify-between text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.35)]">
        <span>Narrative Intelligence Operating System</span>
        <span className="text-[rgba(192,132,252,0.8)]">001 — Threshold</span>
      </div>

      <div className="space-y-8 text-left md:max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm uppercase tracking-[0.5em] text-[rgba(255,255,255,0.45)]"
        >
          Stop writing documents. Start engineering universes.
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-light leading-tight sm:text-6xl"
        >
          The first operating system for narrative intelligence.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-lg text-[var(--fg-secondary)]"
        >
          Stories are living systems with memory, causality, tension, and consequence.
          NIO-OS is a ritual-grade machine that lets you shape those systems in real time.
        </motion.p>

        <div className="flex flex-wrap items-center gap-4">
          <GravityWellAction strength={0.18} radius={220}>
            <button
              onClick={onBegin}
              className="group inline-flex items-center gap-3 rounded-full border border-[rgba(139,92,246,0.5)] bg-[rgba(139,92,246,0.12)] px-10 py-3 text-sm uppercase tracking-[0.3em] text-white shadow-[0_0_42px_rgba(139,92,246,0.25)] transition hover:border-[rgba(139,92,246,0.85)] hover:bg-[rgba(139,92,246,0.2)]"
            >
              Ignite the Awakening
              <span className="translate-x-0.5 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
            </button>
          </GravityWellAction>
          <button
            onClick={onPreview}
            className="rounded-full border border-[rgba(255,255,255,0.15)] px-6 py-3 text-xs uppercase tracking-[0.3em] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,255,255,0.4)] hover:text-white"
          >
            Witness the Nexus
          </button>
          {!isAuthenticated && (
            <Link href="/login" className="text-xs uppercase tracking-[0.3em] text-[rgba(255,255,255,0.45)] hover:text-white">
              Already initiated? Enter →
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(7,5,14,0.75)] p-5 shadow-[0_0_48px_rgba(139,92,246,0.1)]">
          <div className="absolute inset-0 opacity-60 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">Pressure HUD — Live</p>
            <div className="mt-3">
              <PressureHUD metrics={pressureMetrics} />
            </div>
            <p className="mt-3 text-[11px] text-[var(--fg-muted)]">
              NIO-OS is already simulating <span className="gradient-text">The River of Broken Oaths</span>.
              Enter to feel the system push back.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(10,7,16,0.7)] p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.18),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(14,165,233,0.18),transparent_40%)] opacity-80" />
          <div className="relative space-y-3">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">Impossible capabilities</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Contradiction detection + fracture alerts",
                "Secret exposure forecasting",
                "Scene gravity + thread heat sensing",
                "Emotional debt + resonance mapping",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-[rgba(139,92,246,0.25)] bg-[rgba(18,14,26,0.7)] p-3 text-sm text-[var(--fg-secondary)] shadow-[0_0_24px_rgba(139,92,246,0.08)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AwakeningSequence(props: {
  currentPhase: string;
  phaseIndex: number;
  mirrorInput: string;
  mirrorChoice: string | null;
  seed: { character: string; conflict: string; change: string };
  gravity: Record<string, number>;
  intelligenceMode: string;
  onMirrorInputChange: (v: string) => void;
  onMirrorChoiceChange: (v: string | null) => void;
  onSeedChange: (v: Partial<{ character: string; conflict: string; change: string }>) => void;
  onGravityChange: (v: Record<string, number>) => void;
  onModeChange: (v: string) => void;
  onNext: () => void;
}) {
  const {
    currentPhase,
    phaseIndex,
    mirrorInput,
    mirrorChoice,
    seed,
    gravity,
    intelligenceMode,
    onMirrorInputChange,
    onMirrorChoiceChange,
    onSeedChange,
    onGravityChange,
    onModeChange,
    onNext,
  } = props;

  return (
    <motion.section
      key="awakening-section"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.6 }}
      className="relative flex min-h-screen items-center justify-center px-6 py-16"
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-[rgba(139,92,246,0.3)] bg-[rgba(8,6,15,0.9)] shadow-[0_0_64px_rgba(139,92,246,0.15)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.15),transparent_40%)] opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_30%,rgba(139,92,246,0.06)_70%,transparent)] mix-blend-screen" />

        <div className="relative z-10 space-y-10 px-6 py-10 sm:px-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">
            <span>Awakening Chamber</span>
            <span className="text-[rgba(192,132,252,0.8)]">{PHASE_LABELS[currentPhase as keyof typeof PHASE_LABELS]}</span>
          </div>

          <AnimatePresence mode="wait">
            {currentPhase === "void" && <VoidPhase onNext={onNext} />}
            {currentPhase === "question" && <QuestionPhase onNext={onNext} />}
            {currentPhase === "mirror" && (
              <MirrorPhase
                mirrorInput={mirrorInput}
                onMirrorInputChange={onMirrorInputChange}
                mirrorChoice={mirrorChoice}
                onMirrorChoiceChange={onMirrorChoiceChange}
                onNext={onNext}
              />
            )}
            {currentPhase === "seed" && <SeedPhase seed={seed} onSeedChange={onSeedChange} onNext={onNext} />}
            {currentPhase === "pact" && <PactPhase onNext={onNext} />}
            {currentPhase === "gravity" && (
              <GravityPhase gravity={gravity} onGravityChange={onGravityChange} onNext={onNext} />
            )}
            {currentPhase === "intelligence" && (
              <IntelligencePhase intelligenceMode={intelligenceMode} onModeChange={onModeChange} onNext={onNext} />
            )}
            {currentPhase === "ignition" && (
              <IgnitionPhase igniting={false} seed={seed} intelligenceMode={intelligenceMode} onIgnite={onNext} />
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-1">
              {PHASES.map((p, i) => (
                <div
                  key={p}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= phaseIndex ? "w-8 bg-[rgba(192,132,252,0.85)]" : "w-2 bg-[rgba(139,92,246,0.25)]"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-[var(--fg-muted)]">
              {PHASE_LABELS[currentPhase as keyof typeof PHASE_LABELS]} — {phaseIndex + 1} / {PHASES.length}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function IgnitionSequence({
  seed,
  intelligenceMode,
  igniting,
  onIgniteComplete,
}: {
  seed: { character: string; conflict: string; change: string };
  intelligenceMode: string;
  igniting: boolean;
  onIgniteComplete: () => void;
}) {
  const ignitionCopy = igniting ? "Universe ignition underway" : "Ready to ignite";

  return (
    <motion.section
      key="ignition-section"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7 }}
      className="relative flex min-h-screen items-center justify-center px-6 py-16"
    >
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-[rgba(139,92,246,0.35)] bg-[rgba(6,4,12,0.92)] shadow-[0_0_80px_rgba(139,92,246,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.2),transparent_60%)]" />
        <div className="relative z-10 grid gap-8 p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 text-center lg:text-left">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">Universe Ignition</p>
            <h2 className="text-4xl font-light">Genesis Burst</h2>
            <p className="text-sm text-[var(--fg-secondary)]">
              Threads ignite. Nodes awaken. Narrative physics engage. The system has inferred a Style DNA and is stabilizing the Origin Nexus.
            </p>
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <span className="h-2 w-2 animate-nio-resonate rounded-full bg-[rgba(139,92,246,0.85)] shadow-[0_0_16px_rgba(139,92,246,0.6)]" />
              <p className="text-xs uppercase tracking-[0.3em] text-[rgba(255,255,255,0.7)]">{ignitionCopy}</p>
            </div>
            <GravityWellAction strength={0.14} radius={180}>
              <button
                onClick={onIgniteComplete}
                className="mt-4 inline-flex items-center gap-3 rounded-full border border-[rgba(192,132,252,0.6)] px-8 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:border-[rgba(192,132,252,0.9)] hover:bg-[rgba(192,132,252,0.12)]"
              >
                Collapse into Origin Nexus
                <span className="translate-x-0.5 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
              </button>
            </GravityWellAction>
          </div>

          <div className="relative flex flex-col items-center gap-6 lg:items-end">
            <div className="absolute -left-10 top-2 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.2),transparent_60%)] blur-3xl" />
            <GenesisBurst seed={seed} />
            <StyleDNAMatrix data={{ ...STYLE_DNA, intelligenceMode }} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function OriginNexusPreview({ universeName }: { universeName: string }) {
  const pressureMetrics = [
    { id: "tension", label: "Tension load", value: Math.round(DEMO_UNIVERSE.tensionLoad * 100), max: 100, severity: "medium" as const },
    { id: "instability", label: "Instability", value: Math.round(DEMO_UNIVERSE.instability * 100), max: 100, severity: "low" as const },
    { id: "threads", label: "Thread heat", value: Math.round(DEMO_THREADS.reduce((acc, t) => acc + t.heat, 0) / DEMO_THREADS.length * 100), max: 100, severity: "medium" as const },
    { id: "debt", label: "Emotional debt", value: 68, max: 100, severity: "medium" as const },
  ];

  const characters = useMemo(
    () => DEMO_ENTITIES.filter((e) => e.type === "character"),
    []
  );

  return (
    <motion.section
      key="origin-nexus"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.8 }}
      className="relative flex min-h-screen items-center px-6 py-12"
    >
      <div className="relative w-full overflow-hidden rounded-3xl border border-[rgba(139,92,246,0.35)] bg-[rgba(7,5,14,0.88)] shadow-[0_0_90px_rgba(139,92,246,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_20%_70%,rgba(34,197,94,0.15),transparent_45%)] opacity-90" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_30%,rgba(139,92,246,0.08)_70%,transparent)] mix-blend-screen" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center p-8 sm:p-12">
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(12,9,18,0.8)] p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.2),transparent_50%)] opacity-80" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">
                <span>Origin Nexus</span>
                <span className="text-[rgba(192,132,252,0.9)]">Universe Heart</span>
              </div>
              <div className="relative h-[360px] overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.12),transparent_65%)]">
                <div className="absolute inset-0">
                  <div className="cosmos-orbit" />
                  <div className="cosmos-orbit orbit-2" />
                  <div className="cosmos-river" />
                </div>
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.7),rgba(236,72,153,0.5))] shadow-[0_0_48px_rgba(139,92,246,0.6)] animate-nio-resonate" />
                  <p className="text-xs uppercase tracking-[0.3em] text-[rgba(255,255,255,0.6)]">{universeName}</p>
                  <p className="text-[10px] text-[rgba(255,255,255,0.45)]">Instability {Math.round(DEMO_UNIVERSE.instability * 100)}%</p>
                </div>
                <div className="absolute inset-6">
                  <PressureHUD metrics={pressureMetrics} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {DEMO_THREADS.slice(0, 4).map((thread) => (
                  <div
                    key={thread.id}
                    className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[rgba(255,255,255,0.8)]"
                  >
                    {thread.name} — heat {Math.round(thread.heat * 100)}%
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(12,9,18,0.82)] p-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">Oracle Presence</p>
              <div className="mt-4 space-y-3">
                {DEMO_ORACLE.slice(0, 3).map((o) => (
                  <div
                    key={o.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      o.severity === "high"
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.06)]"
                    }`}
                  >
                    {o.message}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-3 text-xs uppercase tracking-[0.25em]">
                <Link href="/simulation" className="text-[rgba(139,92,246,0.9)] hover:text-white">Run Simulation →</Link>
                <Link href="/ascend" className="text-[rgba(255,255,255,0.5)] hover:text-white">Ascend →</Link>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(12,9,18,0.8)] p-6">
              <p className="text-[10px] uppercase tracking-[0.4em] text-[rgba(255,255,255,0.5)]">Character Constellation</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {characters.map((c) => (
                  <Link
                    key={c.id}
                    href={`/mindspace/${c.id}`}
                    className="group relative overflow-hidden rounded-full border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.1)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[rgba(139,92,246,0.14)] via-transparent to-[rgba(236,72,153,0.16)] opacity-0 transition group-hover:opacity-100" />
                    <span className="relative">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <GravityWellAction strength={0.16} radius={200}>
              <Link
                href="/nexus"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full border border-[rgba(192,132,252,0.6)] bg-[rgba(139,92,246,0.14)] px-6 py-4 text-sm uppercase tracking-[0.35em] text-white shadow-[0_0_52px_rgba(139,92,246,0.2)] transition hover:border-[rgba(192,132,252,0.9)] hover:bg-[rgba(139,92,246,0.22)]"
              >
                Enter Origin Nexus
                <span className="translate-x-0.5 opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100">→</span>
              </Link>
            </GravityWellAction>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
