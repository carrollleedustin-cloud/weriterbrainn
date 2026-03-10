"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type CursorMode = "inspect" | "weave" | "stabilize" | "simulate" | "cut" | "echo" | "invoke";

const MODES: { id: CursorMode; label: string }[] = [
  { id: "inspect", label: "Inspect" },
  { id: "weave", label: "Weave" },
  { id: "stabilize", label: "Stabilize" },
  { id: "simulate", label: "Simulate" },
  { id: "cut", label: "Cut" },
  { id: "echo", label: "Echo" },
  { id: "invoke", label: "Invoke" },
];

const ThoughtCursorContext = createContext<{
  mode: CursorMode;
  setMode: (m: CursorMode) => void;
} | null>(null);

export function ThoughtCursorProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<CursorMode>("inspect");
  return (
    <ThoughtCursorContext.Provider value={{ mode, setMode }}>
      {children}
    </ThoughtCursorContext.Provider>
  );
}

export function useThoughtCursor() {
  const ctx = useContext(ThoughtCursorContext);
  return ctx ?? { mode: "inspect" as CursorMode, setMode: () => {} };
}

export function ThoughtCursorHUD() {
  const { mode, setMode } = useThoughtCursor();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.cursorMode = mode;
    return () => {
      delete document.documentElement.dataset.cursorMode;
    };
  }, [mode]);

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div
        className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(10,7,16,0.95)] backdrop-blur-md"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center gap-1 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
            {mode}
          </span>
          {expanded && (
            <div className="ml-2 flex gap-0.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`rounded px-2 py-0.5 text-[9px] uppercase transition ${
                    mode === m.id
                      ? "bg-[rgba(139,92,246,0.4)] text-white"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
                  }`}
                >
                  {m.label.slice(0, 1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
