import type { AwakeningPhase } from "@/store/awakening";

export const PHASES: AwakeningPhase[] = [
  "void", "question", "mirror", "seed", "pact", "gravity", "intelligence", "ignition",
];

export const PHASE_LABELS: Record<AwakeningPhase, string> = {
  void: "Void", question: "Question", mirror: "Mirror", seed: "Seed",
  pact: "Pact", gravity: "Gravity", intelligence: "Intelligence",
  ignition: "Ignition", nexus: "Nexus",
};

export const phaseTransition = {
  initial: { opacity: 0, y: 16, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(4px)" },
  transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] as const },
};

export const INTELLIGENCE_MODES = [
  { id: "explorer", label: "Explorer", desc: "Curious, suggestive, non-invasive" },
  { id: "architect", label: "Architect", desc: "Structural, strategic, interventionist" },
  { id: "oracle", label: "Oracle", desc: "Prophetic, warns, reveals consequences" },
  { id: "chaos", label: "Chaos", desc: "Unpredictable, destabilizing, generative" },
  { id: "cinematic", label: "Cinematic", desc: "Scene-aware, visual, pacing-focused" },
  { id: "surgical", label: "Surgical", desc: "Precise, minimal, continuity-first" },
];
