"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Receives error + reset function. */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Called when an error is caught — useful for telemetry */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);

    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        });
      }
      return <DefaultFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Default fallback — NIO-styled crash screen
// ---------------------------------------------------------------------------

function DefaultFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border border-red-500/30 bg-red-500/5 flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-8 w-8 text-red-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div className="absolute inset-0 h-16 w-16 rounded-full border border-red-500/20 animate-nio-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--fg-primary)]">
          System Fracture Detected
        </h2>
        <p className="text-sm text-[var(--fg-secondary)]">
          A dimensional instability has been encountered. The system can attempt recovery.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-3 max-h-32 overflow-auto rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-left text-xs text-red-300/80 font-mono">
            {error.message}
          </pre>
        )}
      </div>

      <button
        onClick={reset}
        className="rounded-lg border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.1)] px-6 py-2.5 text-sm font-medium text-[rgba(139,92,246,0.9)] transition-all hover:bg-[rgba(139,92,246,0.2)] hover:border-[rgba(139,92,246,0.5)]"
      >
        Attempt Recovery
      </button>
    </div>
  );
}
