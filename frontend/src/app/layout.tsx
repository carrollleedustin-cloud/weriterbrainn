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
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}
      >
        <header className="border-b border-zinc-800">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-zinc-50">
              WeriterBrainn
            </Link>
            <ul className="flex items-center gap-6">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-zinc-400 transition hover:text-zinc-50"
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
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
