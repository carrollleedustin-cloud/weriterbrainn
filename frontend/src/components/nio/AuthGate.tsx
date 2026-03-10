"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";

interface AuthGateProps {
  children: React.ReactNode;
  /** Content shown in the auth-required fallback header area */
  fallbackHeader?: React.ReactNode;
  /** Loading skeleton height class */
  skeletonClass?: string;
}

export function AuthGate({
  children,
  fallbackHeader,
  skeletonClass = "h-[200px]",
}: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {fallbackHeader}
        <Skeleton className={skeletonClass} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        {fallbackHeader}
        <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <p className="text-amber-200">
            Sign in to access this dimension.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-lg border border-[rgba(139,92,246,0.4)] bg-[rgba(139,92,246,0.1)] px-4 py-2 text-sm text-[rgba(139,92,246,0.9)] transition hover:bg-[rgba(139,92,246,0.2)]"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
