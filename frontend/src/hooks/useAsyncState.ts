"use client";

import { useState, useCallback, useRef } from "react";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  run: (...args: unknown[]) => Promise<void>;
  reset: () => void;
  setData: (val: T | ((prev: T) => T)) => void;
}

/**
 * Generic hook for async operations with loading/error tracking.
 * Eliminates the repeated `useState(true) + useState<string|null>(null)` pattern.
 */
export function useAsyncState<T>(
  initialData: T,
  asyncFn?: (...args: unknown[]) => Promise<T>,
  options?: { initialLoading?: boolean }
): AsyncState<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(options?.initialLoading ?? false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const run = useCallback(
    async (...args: unknown[]) => {
      if (!asyncFn) return;
      setLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        if (mountedRef.current) setData(result);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : "An error occurred");
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, run, reset, setData };
}
