"use client";

import { useEffect } from "react";

const SHORTCUTS = [
  { keys: ["⌘/Ctrl", "K"], desc: "Focus Oracle chat" },
  { keys: ["⌘/Ctrl", "1"], desc: "Nexus" },
  { keys: ["⌘/Ctrl", "2"], desc: "Story Cosmos" },
  { keys: ["⌘/Ctrl", "3"], desc: "River of Time" },
  { keys: ["⌘/Ctrl", "4"], desc: "Loom of Fate" },
  { keys: ["⌘/Ctrl", "5"], desc: "Character Mindspace" },
  { keys: ["⌘/Ctrl", "6"], desc: "Living Forge" },
  { keys: ["⌘/Ctrl", "7"], desc: "Oracle" },
  { keys: ["⌘/Ctrl", "8"], desc: "Ascend" },
  { keys: ["⌘/Ctrl", "9"], desc: "Simulation Chamber" },
  { keys: ["⌘/Ctrl", "Enter"], desc: "Send message (Oracle)" },
  { keys: ["?"], desc: "Show shortcuts" },
];

export function ShortcutsModal() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.getAttribute("data-shortcuts-backdrop") === "true") {
        document.getElementById("shortcuts-modal")?.classList.add("hidden");
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      id="shortcuts-modal"
      data-shortcuts-backdrop="true"
      className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.35)] bg-[var(--bg-raised)] p-6 shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "?" && document.getElementById("shortcuts-modal")?.classList.add("hidden")}
      >
        <h3 className="mb-4 text-lg font-semibold text-[var(--fg-primary)]">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-8">
              <span className="text-sm text-[var(--fg-secondary)]">{s.desc}</span>
              <span className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="rounded border border-[rgba(139,92,246,0.4)] bg-[var(--bg-overlay)] px-2 py-0.5 text-xs font-mono text-[var(--accent-strong)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--fg-muted)]">Press ? to close</p>
      </div>
    </div>
  );
}
