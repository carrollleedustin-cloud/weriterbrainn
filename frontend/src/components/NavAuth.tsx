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

  if (loading) return <span className="text-zinc-500">...</span>;
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">
          {user.display_name || user.email}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded bg-zinc-700 px-2 py-1 text-sm hover:bg-zinc-600"
        >
          Log out
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-4">
      <Link href="/login" className="text-zinc-400 hover:text-zinc-50">
        Log in
      </Link>
      <Link href="/register" className="text-zinc-400 hover:text-zinc-50">
        Register
      </Link>
    </div>
  );
}
