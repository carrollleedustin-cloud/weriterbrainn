"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.access_token);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 space-y-1 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
            Neural Access
          </div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Log in</h1>
          <p className="text-sm text-[var(--fg-muted)]">Enter your credentials to sync your brain.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--fg-muted)]">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--fg-muted)]">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} variant="primary" className="w-full">
            {loading ? "..." : "Log in"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--fg-muted)]">
          No account?{" "}
          <Link href="/register" className="text-[var(--fg-primary)] hover:text-[var(--accent-strong)]">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
