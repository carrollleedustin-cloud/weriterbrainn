"use client";

import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ShortcutsModal } from "./ShortcutsModal";

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  useGlobalShortcuts();
  return (
    <>
      {children}
      <ShortcutsModal />
    </>
  );
}
