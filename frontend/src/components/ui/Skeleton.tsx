"use client";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[rgba(139,92,246,0.12)] ${className}`}
      aria-hidden
      {...props}
    />
  );
}

/** Card-shaped skeleton for Pulse/Universe stats */
export function SkeletonCard() {
  return (
    <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-full" />
    </div>
  );
}

/** Grid of skeleton cards */
export function SkeletonCardGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Tall skeleton for graph/canvas area */
export function SkeletonGraph() {
  return (
    <div className="flex h-[520px] flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/50">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}
