import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ShortcutsProvider } from "@/components/ShortcutsProvider";
import { LayoutSwitcher } from "@/components/nio/LayoutSwitcher";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  title: "NIO-OS — Narrative Intelligence Operating System",
  description: "The first operating system for narrative computing. Stories as living universes.",
};

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
        <ErrorBoundary>
          <AuthProvider>
            <ShortcutsProvider>
              <LayoutSwitcher>{children}</LayoutSwitcher>
            </ShortcutsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
