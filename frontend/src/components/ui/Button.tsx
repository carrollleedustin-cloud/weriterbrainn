"use client";

import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:brightness-110 hover:shadow-[0_0_32px_rgba(139,92,246,0.45)] active:scale-[0.98]",
  secondary:
    "bg-[linear-gradient(145deg,rgba(19,16,28,0.9),rgba(26,21,40,0.8))] text-[var(--fg-primary)] border border-[rgba(139,92,246,0.35)] hover:border-[rgba(139,92,246,0.5)] hover:bg-[rgba(139,92,246,0.12)] hover:shadow-[0_0_16px_rgba(139,92,246,0.15)]",
  ghost:
    "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[rgba(139,92,246,0.12)]",
  danger:
    "bg-red-500/20 text-red-300 hover:bg-red-500/30",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button({ className = "", variant = "secondary", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
});
