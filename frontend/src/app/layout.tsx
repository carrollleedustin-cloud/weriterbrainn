import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavAuth from "@/components/NavAuth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WeriterBrainn – Personal AI Brain",
  description: "A persistent AI thinking partner and knowledge engine.",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "AI Chat" },
  { href: "/memories", label: "Memory Explorer" },
  { href: "/graph", label: "Knowledge Graph" },
  { href: "/writing", label: "Writing Assistant" },
  { href: "/analytics", label: "Analytics" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--bg-base)] text-[var(--fg-primary)] antialiased`}
      >
        <header className="sticky top-0 z-10 border-b border-[rgba(139,92,246,0.18)] bg-[var(--bg-base)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-base)]/60">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-muted)] text-[var(--accent-strong)] shadow-[var(--shadow-sm)]">
                ◎
              </span>
              <span className="text-lg font-semibold">
                <span className="gradient-text">WeriterBrainn</span>
              </span>
            </Link>
            <ul className="flex items-center gap-4">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-full border border-transparent px-3 py-1 text-sm text-[var(--fg-secondary)] transition-all hover:border-[rgba(139,92,246,0.35)] hover:text-[var(--fg-primary)] hover:shadow-[var(--shadow-sm)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="ml-auto">
                <NavAuth />
              </li>
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="relative">
            <div className="pointer-events-none absolute -top-20 right-6 h-32 w-32 rounded-full bg-[rgba(139,92,246,0.25)] blur-3xl animate-float-glow" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-40 w-40 rounded-full bg-[rgba(192,132,252,0.2)] blur-3xl animate-float-glow" />
            <div className="aurora-border relative z-[1]">
              <div className="rounded-[var(--radius-lg)] bg-[var(--bg-raised)]/70 p-6 shadow-[var(--shadow-md)]">
                {children}
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
