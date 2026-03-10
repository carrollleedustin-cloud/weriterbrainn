"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useCallback } from "react";
import { nioBus, type NIOEventMap, type EventName } from "@/lib/event-bus";
import { dimensionRegistry } from "@/lib/dimension-registry";

/**
 * Subscribe to an NIO event bus event inside a React component.
 * Automatically unsubscribes on unmount.
 */
export function useNIOEvent<E extends EventName>(
  event: E,
  handler: (payload: NIOEventMap[E]) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const off = nioBus.on(event, (payload) => {
      handlerRef.current(payload as NIOEventMap[E]);
    });
    return off;
  }, [event]);
}

/**
 * Subscribe to an NIO event and track the latest payload as state.
 * Returns the most recent payload, or `null` if no event has fired.
 */
export function useNIOEventState<E extends EventName>(
  event: E
): NIOEventMap[E] | null {
  const [latest, setLatest] = useState<NIOEventMap[E] | null>(null);

  useEffect(() => {
    return nioBus.on(event, (payload) => {
      setLatest(payload as NIOEventMap[E]);
    });
  }, [event]);

  return latest;
}

/**
 * Emit an event from a React component. Returns a stable emit function.
 */
export function useNIOEmit<E extends EventName>(event: E) {
  return useCallback(
    (payload: NIOEventMap[E]) => {
      nioBus.emit(event, payload);
    },
    [event]
  );
}

/**
 * Hook that reads the current list of dimensions from the registry.
 * Re-renders when dimensions change.
 */
export function useDimensions() {
  const getSnapshot = useCallback(() => dimensionRegistry.getAll(), []);
  const subscribe = useCallback(
    (onStoreChange: () => void) => dimensionRegistry.onChange(onStoreChange),
    []
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook for dimensions visible in the dimension nav strip.
 */
export function useDimensionNav() {
  const getSnapshot = useCallback(() => dimensionRegistry.getDimensionNavItems(), []);
  const subscribe = useCallback(
    (onStoreChange: () => void) => dimensionRegistry.onChange(onStoreChange),
    []
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Hook for dimensions visible in the header nav bar.
 */
export function useNavDimensions() {
  const getSnapshot = useCallback(() => dimensionRegistry.getNavDimensions(), []);
  const subscribe = useCallback(
    (onStoreChange: () => void) => dimensionRegistry.onChange(onStoreChange),
    []
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
