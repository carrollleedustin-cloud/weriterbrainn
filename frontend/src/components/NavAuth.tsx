"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/api";
import { clearToken } from "@/lib/auth";

export default function NavAuth() {
  const [user, setUser] = useState<{ email: string; display_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  if (loading) return <span className="text-[var(--fg-muted)]">...</span>;
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="rounded-full border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          {user.display_name || user.email}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-3 py-1.5 text-sm text-[var(--fg-primary)] transition-all hover:bg-[rgba(139,92,246,0.2)]"
        >
          Log out
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <Link
        href="/login"
        className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-sm text-[var(--fg-primary)] transition-all hover:bg-[rgba(139,92,246,0.2)]"
      >
        Log in
      </Link>
      <Link
        href="/register"
        className="rounded-full border border-transparent px-3 py-1 text-sm text-[var(--fg-secondary)] transition-all hover:border-[rgba(139,92,246,0.35)] hover:text-[var(--fg-primary)]"
      >
        Register
      </Link>
    </div>
  );
}
