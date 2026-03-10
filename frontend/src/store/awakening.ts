import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AwakeningPhase =
  | "void"
  | "question"
  | "mirror"
  | "seed"
  | "pact"
  | "gravity"
  | "intelligence"
  | "ignition"
  | "nexus";

export type SeedData = {
  character: string;
  conflict: string;
  change: string;
};

export type MirrorChoice = string | null;

export type GravityCalibration = Record<string, number>;

export interface AwakeningState {
  phase: AwakeningPhase;
  mirrorInput: string;
  mirrorChoice: MirrorChoice;
  seed: SeedData;
  gravity: GravityCalibration;
  intelligenceMode: string;
  universeName: string;
  styleDNA: Record<string, number | string>;
  setPhase: (p: AwakeningPhase) => void;
  setMirrorInput: (s: string) => void;
  setMirrorChoice: (s: MirrorChoice) => void;
  setSeed: (s: Partial<SeedData>) => void;
  setGravity: (g: Partial<GravityCalibration>) => void;
  setIntelligenceMode: (m: string) => void;
  setUniverseName: (n: string) => void;
  setStyleDNA: (d: Partial<Record<string, number | string>>) => void;
  reset: () => void;
}

const defaultSeed: SeedData = { character: "", conflict: "", change: "" };
const defaultGravity: GravityCalibration = {
  genre: 0.7,
  tonal: 0.6,
  intensity: 0.85,
  mythic: 0.5,
  complexity: 0.72,
  instability: 0.4,
};

export const useAwakening = create<AwakeningState>()(
  persist(
    (set) => ({
      phase: "void",
      mirrorInput: "",
      mirrorChoice: null,
      seed: defaultSeed,
      gravity: defaultGravity,
      intelligenceMode: "architect",
      universeName: "",
      styleDNA: {},
      setPhase: (phase) => set({ phase }),
      setMirrorInput: (mirrorInput) => set({ mirrorInput }),
      setMirrorChoice: (mirrorChoice) => set({ mirrorChoice }),
      setSeed: (s) => set((state) => ({ seed: { ...state.seed, ...s } })),
      setGravity: (g) =>
        set((state) => ({
          gravity: { ...state.gravity, ...g } as GravityCalibration,
        })),
      setIntelligenceMode: (intelligenceMode) => set({ intelligenceMode }),
      setUniverseName: (universeName) => set({ universeName }),
      setStyleDNA: (d) =>
        set((state) => ({
          styleDNA: { ...state.styleDNA, ...d } as Record<string, number | string>,
        })),
      reset: () =>
        set({
          phase: "void",
          mirrorInput: "",
          mirrorChoice: null,
          seed: defaultSeed,
          gravity: defaultGravity,
          intelligenceMode: "architect",
          universeName: "",
          styleDNA: {},
        }),
    }),
    { name: "nio-awakening" }
  )
);
