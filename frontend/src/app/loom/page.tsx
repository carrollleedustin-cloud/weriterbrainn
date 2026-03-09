"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoomPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/universe?tab=threads");
  }, [router]);

  return (
    <div className="space-y-4 p-4">
      <p className="text-[var(--fg-muted)]">Redirecting to Loom (plot threads)...</p>
      <Link href="/universe?tab=threads" className="text-sm text-[rgba(139,92,246,0.9)] hover:underline">
        Go to Loom →
      </Link>
    </div>
  );
}
