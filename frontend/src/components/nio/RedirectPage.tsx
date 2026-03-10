"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RedirectPageProps {
  to: string;
  label: string;
}

export function RedirectPage({ to, label }: RedirectPageProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-4 w-4 mx-auto animate-nio-pulse rounded-full bg-[rgba(139,92,246,0.6)] shadow-[0_0_16px_rgba(139,92,246,0.3)]" />
        <p className="text-xs uppercase tracking-wider text-[var(--fg-muted)]">
          Redirecting to {label}...
        </p>
      </div>
    </div>
  );
}
