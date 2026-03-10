"use client";

import { useRef, useEffect, useState } from "react";

export function GravityWellAction({
  children,
  className = "",
  strength = 0.15,
  radius = 120,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius) {
        const factor = (1 - dist / radius) * strength;
        el.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
      } else {
        el.style.transform = "";
      }
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [radius, strength]);

  return (
    <div ref={ref} className={`gravity-well transition-transform duration-150 ${className}`}>
      {children}
    </div>
  );
}
