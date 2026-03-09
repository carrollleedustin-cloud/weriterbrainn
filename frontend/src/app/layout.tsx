import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import NavAuth from "@/components/NavAuth";
import { ShortcutsProvider } from "@/components/ShortcutsProvider";
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
  { href: "/pulse", label: "Pulse" },
  { href: "/chat", label: "AI Chat" },
  { href: "/universe", label: "Story Universe" },
  { href: "/cast", label: "Cast" },
  { href: "/signal", label: "Signal" },
  { href: "/river", label: "River" },
  { href: "/loom", label: "Loom" },
  { href: "/memories", label: "Memories" },
  { href: "/graph", label: "Knowledge Graph" },
  { href: "/writing", label: "Writing" },
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
              <li className="ml-auto flex items-center gap-2">
                <span className="text-xs text-[var(--fg-muted)] hidden sm:inline">? shortcuts</span>
                <NavAuth />
              </li>
            </ul>
          </nav>
        </header>
        <ShortcutsProvider>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="relative">
            <div className="pointer-events-none absolute -top-20 right-6 h-48 w-48 rounded-full bg-[rgba(139,92,246,0.2)] blur-3xl animate-float-glow" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-[rgba(192,132,252,0.15)] blur-3xl animate-float-glow" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[rgba(139,92,246,0.04)] blur-3xl" />
            <div className="aurora-border relative z-[1] glow-border">
              <div className="rounded-[var(--radius-lg)] cosmos-panel p-6 sm:p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
        </ShortcutsProvider>
      </body>
    </html>
  );
}
