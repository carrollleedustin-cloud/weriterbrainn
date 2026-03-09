"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ShortcutHandler = () => void;

/** Global keyboard shortcuts: Cmd/Ctrl+K focus chat, Cmd/Ctrl+1–6 nav, ? for help. */
export function useGlobalShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod && e.key !== "?") return;

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/chat");
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('[aria-label="Chat message input"]');
          input?.focus();
        }, 100);
        return;
      }

      if (mod && e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const routes = ["/", "/chat", "/memories", "/graph", "/writing", "/analytics"];
        const idx = parseInt(e.key, 10) - 1;
        if (routes[idx]) router.push(routes[idx]);
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const modal = document.getElementById("shortcuts-modal");
        if (modal) {
          modal.classList.toggle("hidden");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}

/** Chat-specific shortcuts: Cmd/Ctrl+Enter to send. */
export function useChatShortcuts(options: {
  onSend?: ShortcutHandler;
  onClear?: ShortcutHandler;
  disabled?: boolean;
}) {
  const { onSend, onClear, disabled } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "Escape") {
        if (isInput && (target as HTMLInputElement).value === "") {
          (target as HTMLInputElement).blur();
        }
        onClear?.();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onSend?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSend, onClear, disabled]);
}
