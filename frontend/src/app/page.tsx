"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StoryFieldCanvas } from "@/components/nio/StoryFieldCanvas";
import { GravityWellAction } from "@/components/nio/GravityWellAction";
import { useAuth } from "@/hooks/useAuth";
import { LandingHero } from "./sections/LandingHero";
import { LandingDimensions } from "./sections/LandingDimensions";
import { LandingCapabilities } from "./sections/LandingCapabilities";
import { LandingTiers } from "./sections/LandingTiers";

export default function Threshold() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <StoryFieldCanvas mouse={mouse} />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="h-6 w-6 animate-nio-pulse rounded-full bg-[rgba(139,92,246,0.6)] shadow-[0_0_24px_rgba(139,92,246,0.4)]" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="relative min-h-screen">
        <StoryFieldCanvas mouse={mouse} />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-2 text-[10px] uppercase tracking-[0.4em] text-[rgba(139,92,246,0.8)]"
            >
              Narrative Intelligence Operating System
            </motion.p>
            <p className="mb-6 text-sm text-[var(--fg-muted)]">You have crossed the threshold.</p>
            <GravityWellAction strength={0.1} radius={160}>
              <Link
                href="/nexus"
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.08)] px-10 py-4 text-lg font-medium text-white backdrop-blur-sm transition hover:border-[rgba(139,92,246,0.9)] hover:bg-[rgba(139,92,246,0.18)] hover:shadow-[0_0_48px_rgba(139,92,246,0.35)]"
              >
                Enter Origin Nexus
                <span className="opacity-70 transition group-hover:opacity-100 group-hover:translate-x-0.5">→</span>
              </Link>
            </GravityWellAction>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <StoryFieldCanvas mouse={mouse} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex justify-between px-8 py-6">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-sm tracking-[0.3em] text-[rgba(255,255,255,0.5)]"
          >
            NIO-OS
          </motion.span>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex gap-4"
          >
            <Link href="/login" className="text-sm text-[rgba(255,255,255,0.6)] transition hover:text-white">Sign in</Link>
            <Link href="/register" className="text-sm text-[rgba(255,255,255,0.6)] transition hover:text-white">Create account</Link>
          </motion.div>
        </header>

        <LandingHero />

        <section className="border-t border-[rgba(139,92,246,0.15)] px-8 py-16">
          <div className="mx-auto max-w-5xl">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center text-xs uppercase tracking-[0.4em] text-[var(--fg-muted)]"
            >
              Why old writing software failed
            </motion.h2>
            <div className="grid gap-12 sm:grid-cols-3">
              {[
                { title: "No narrative memory", desc: "Legacy tools treat each scene as a file. No causality, no consequence, no thread awareness." },
                { title: "No emotional systems", desc: "Characters exist as names. No desires, fears, contradictions, or psychological topology." },
                { title: "No world-state logic", desc: "Continuity breaks. Secrets leak. Threads fray. Timelines fracture. No one notices." },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="space-y-2"
                >
                  <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--fg-muted)]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <LandingDimensions />
        <LandingCapabilities />
        <LandingTiers />

        <section className="border-t border-[rgba(139,92,246,0.12)] px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="mb-8 text-lg text-[var(--fg-secondary)]">Cross into narrative computing.</p>
            <GravityWellAction strength={0.1} radius={160}>
              <Link
                href="/awaken"
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[rgba(139,92,246,0.6)] bg-[rgba(139,92,246,0.06)] px-12 py-4 text-base font-medium text-white transition hover:border-[rgba(139,92,246,0.9)] hover:bg-[rgba(139,92,246,0.15)] hover:shadow-[0_0_48px_rgba(139,92,246,0.25)]"
              >
                Ignite a Universe
                <span className="opacity-60 transition group-hover:opacity-100 group-hover:translate-x-0.5">→</span>
              </Link>
            </GravityWellAction>
          </motion.div>
        </section>

        <footer className="border-t border-[rgba(139,92,246,0.1)] px-8 py-8">
          <p className="text-center text-xs text-[rgba(255,255,255,0.35)]">
            Narrative computing changes what stories can become.
          </p>
        </footer>
      </div>
    </div>
  );
}
