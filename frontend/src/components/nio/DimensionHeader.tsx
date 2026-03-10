"use client";

import { DimensionNav } from "./DimensionNav";

interface DimensionHeaderProps {
  title: React.ReactNode;
  subtitle: string;
  tier?: string;
  stats?: React.ReactNode;
  showDimensionNav?: boolean;
}

export function DimensionHeader({
  title,
  subtitle,
  tier,
  stats,
  showDimensionNav = true,
}: DimensionHeaderProps) {
  return (
    <>
      {showDimensionNav && <DimensionNav />}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[var(--fg-muted)]">
            NIO-OS Dimension{tier ? ` · ${tier}` : ""}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--fg-primary)] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">{subtitle}</p>
        </div>
        {stats && <div className="flex items-center gap-3">{stats}</div>}
      </div>
    </>
  );
}
