"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type AuthFormProps = {
  mode: "login" | "register";
};

const config = {
  login: {
    title: "Cross the Threshold",
    subtitle: "Return to your narrative command center.",
    submitLabel: "Log in",
    altText: "Not yet awakened?",
    altLabel: "Become the Architect",
    altHref: "/register",
  },
  register: {
    title: "Become the Architect",
    subtitle: "Create your account. Then enter the Awakening Chamber.",
    submitLabel: "Register",
    altText: "Already awakened?",
    altLabel: "Cross the Threshold",
    altHref: "/login",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: loginFn, register: registerFn } = useAuth();

  const c = config[mode];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await loginFn(email, password);
      } else {
        await registerFn(email, password, displayName || undefined);
      }
      router.push("/nexus");
    } catch (err) {
      setError(err instanceof Error ? err.message : `${c.submitLabel} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-raised)]/80 p-6 shadow-[var(--shadow-md)]">
        <div className="mb-6 space-y-1 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
            NIO-OS
          </div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">{c.title}</h1>
          <p className="text-sm text-[var(--fg-muted)]">{c.subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--fg-muted)]">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-[var(--fg-muted)]">
              Password{mode === "register" ? " (min 8 characters)" : ""}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              {...(mode === "register" ? { minLength: 8 } : {})}
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="block text-sm text-[var(--fg-muted)]">Display name (optional)</label>
              <Input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
          )}
          {error && (
            <div className="destabilization rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} variant="primary" className="w-full">
            {loading ? "..." : c.submitLabel}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--fg-muted)]">
          {c.altText}{" "}
          <Link href={c.altHref} className="text-[var(--fg-primary)] hover:text-[var(--accent-strong)]">
            {c.altLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
