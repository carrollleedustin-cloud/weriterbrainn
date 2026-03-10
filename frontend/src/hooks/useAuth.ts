"use client";

import { useEffect } from "react";
import { useAuthStore, type User, type AuthStatus } from "@/store/auth";

export function useAuth(): {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
} {
  const store = useAuthStore();
  const { status, hydrate } = store;

  useEffect(() => {
    if (status === "idle") {
      hydrate();
    }
  }, [status, hydrate]);

  return {
    user: store.user,
    status: store.status,
    error: store.error,
    isAuthenticated: store.status === "authenticated",
    isLoading: store.status === "loading" || store.status === "idle",
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  };
}
