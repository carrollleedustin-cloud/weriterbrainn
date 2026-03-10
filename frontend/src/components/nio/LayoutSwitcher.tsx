"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NavAuth from "@/components/NavAuth";
import { BloomMenu } from "@/components/nio/BloomMenu";
import { ThoughtCursorProvider, ThoughtCursorHUD } from "@/components/nio/ThoughtCursor";
import { dimensionRegistry } from "@/lib/dimension-registry";

const fullBleedPaths = ["/", "/awaken"];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/nexus") return pathname === "/nexus" || pathname.startsWith("/nexus/");
  return pathname === href || pathname.startsWith(href + "/");
}

export function LayoutSwitcher({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [bloomOpen, setBloomOpen] = useState(false);
  const isFullBleed = fullBleedPaths.includes(pathname ?? "/");

  const navDimensions = dimensionRegistry.getNavDimensions();

  if (isFullBleed) {
    return <>{children}</>;
  }

  return (
    <ThoughtCursorProvider>
      <>
        <BloomMenu open={bloomOpen} onClose={() => setBloomOpen(false)} />
        <ThoughtCursorHUD />
        <header className="sticky top-0 z-50 border-b border-[rgba(139,92,246,0.18)] bg-[var(--bg-base)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-base)]/60">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4" aria-label="Main navigation">
            <div className="flex items-center gap-4">
              <Link href="/nexus" className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] text-[var(--accent-strong)]" aria-hidden>
                  ◎
                </span>
                <span className="text-lg font-semibold gradient-text">NIO-OS</span>
              </Link>
              <button
                type="button"
                onClick={() => setBloomOpen(true)}
                className="rounded-full border border-[rgba(139,92,246,0.3)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-muted)] transition hover:border-[rgba(139,92,246,0.5)] hover:text-[var(--fg-primary)]"
                aria-label="Open dimension menu"
              >
                Dimensions
              </button>
            </div>
            <ul className="flex items-center gap-1 sm:gap-2">
              {navDimensions.map((dim) => {
                const active = isActiveRoute(pathname ?? "", dim.href);
                return (
                  <li key={dim.id}>
                    <Link
                      href={dim.href}
                      aria-current={active ? "page" : undefined}
                      title={dim.description}
                      className={`rounded-full border px-3 py-1 text-sm transition-all ${
                        active
                          ? "border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.12)] text-[var(--fg-primary)] shadow-[0_0_8px_rgba(139,92,246,0.1)]"
                          : "border-transparent text-[var(--fg-secondary)] hover:border-[rgba(139,92,246,0.3)] hover:text-[var(--fg-primary)]"
                      }`}
                    >
                      {dim.label}
                    </Link>
                  </li>
                );
              })}
              <li className="ml-2 flex items-center gap-2">
                <span className="hidden text-xs text-[var(--fg-muted)] sm:inline">? shortcuts</span>
                <NavAuth />
              </li>
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="relative">
            <div className="pointer-events-none absolute -top-20 right-6 h-48 w-48 rounded-full bg-[rgba(139,92,246,0.2)] blur-3xl animate-float-glow" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-[rgba(192,132,252,0.15)] blur-3xl animate-float-glow" aria-hidden />
            <div className="aurora-border relative z-[1] glow-border">
              <div className="rounded-[var(--radius-lg)] cosmos-panel p-6 sm:p-8">{children}</div>
            </div>
          </div>
        </main>
      </>
    </ThoughtCursorProvider>
  );
}
