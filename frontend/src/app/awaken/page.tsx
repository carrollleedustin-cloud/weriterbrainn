"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StoryFieldCanvas } from "@/components/nio/StoryFieldCanvas";
import { useAwakening } from "@/store/awakening";
import { DEMO_UNIVERSE, STYLE_DNA } from "@/lib/demo-data";
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
} from "./phases";

export default function AwakenPage() {
  const router = useRouter();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [igniting, setIgniting] = useState(false);

  const {
    mirrorInput, setMirrorInput, mirrorChoice, setMirrorChoice,
    seed, setSeed, gravity, setGravity, intelligenceMode,
    setIntelligenceMode, setPhase, setUniverseName, setStyleDNA,
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

  const currentPhase = PHASES[phaseIndex];

  const nextPhase = () => {
    if (phaseIndex >= PHASES.length - 1) {
      handleIgnition();
      return;
    }
    setPhaseIndex((i) => i + 1);
    setPhase(PHASES[phaseIndex + 1]);
  };

  const handleIgnition = async () => {
    setIgniting(true);
    setUniverseName(DEMO_UNIVERSE.name);
    setStyleDNA(STYLE_DNA);
    await new Promise((r) => setTimeout(r, 3200));
    router.push("/nexus");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020108]">
      <StoryFieldCanvas mouse={mouse} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,transparent_0%,#020108_70%)]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {currentPhase === "void" && <VoidPhase onNext={nextPhase} />}
          {currentPhase === "question" && <QuestionPhase onNext={nextPhase} />}
          {currentPhase === "mirror" && (
            <MirrorPhase
              mirrorInput={mirrorInput}
              onMirrorInputChange={setMirrorInput}
              mirrorChoice={mirrorChoice}
              onMirrorChoiceChange={setMirrorChoice}
              onNext={nextPhase}
            />
          )}
          {currentPhase === "seed" && (
            <SeedPhase seed={seed} onSeedChange={setSeed} onNext={nextPhase} />
          )}
          {currentPhase === "pact" && <PactPhase onNext={nextPhase} />}
          {currentPhase === "gravity" && (
            <GravityPhase gravity={gravity} onGravityChange={setGravity} onNext={nextPhase} />
          )}
          {currentPhase === "intelligence" && (
            <IntelligencePhase
              intelligenceMode={intelligenceMode}
              onModeChange={setIntelligenceMode}
              onNext={nextPhase}
            />
          )}
          {currentPhase === "ignition" && (
            <IgnitionPhase
              igniting={igniting}
              seed={seed}
              intelligenceMode={intelligenceMode}
              onIgnite={handleIgnition}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-[rgba(139,92,246,0.6)]">
            {PHASE_LABELS[currentPhase]}
          </span>
          <div className="flex items-center gap-1">
            {PHASES.map((p, i) => (
              <div
                key={p}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= phaseIndex
                    ? "w-6 bg-[rgba(139,92,246,0.8)]"
                    : "w-2 bg-[rgba(139,92,246,0.2)]"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
