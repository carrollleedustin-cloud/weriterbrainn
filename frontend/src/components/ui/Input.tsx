"use client";

import { forwardRef } from "react";

const baseStyles =
  "w-full rounded-[var(--radius-md)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-overlay)]/80 px-4 py-2.5 text-[var(--fg-primary)] placeholder-[var(--fg-muted)] shadow-[var(--shadow-sm)] transition-all duration-[var(--transition-fast)] focus:border-[var(--accent-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${baseStyles} ${className}`} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${baseStyles} min-h-[100px] resize-y ${className}`}
      {...props}
    />
  );
});
