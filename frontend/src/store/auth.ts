import { create } from "zustand";
import {
  getToken,
  setToken as persistToken,
  clearToken as removeToken,
  isTokenStale,
} from "@/lib/auth";
import { getMe, login as apiLogin, register as apiRegister } from "@/lib/api";
import { isApiError } from "@/lib/errors";
import { nioBus } from "@/lib/event-bus";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = {
  id: string;
  email: string;
  display_name?: string;
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "anonymous";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;

  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: "idle",
  error: null,

  hydrate: async () => {
    // Prevent concurrent hydrations
    if (get().status === "loading") return;

    const token = getToken();
    if (!token) {
      set({ status: "anonymous", user: null });
      return;
    }

    // If token is very stale, verify it
    set({ status: "loading" });
    try {
      const me = await getMe();
      if (me) {
        set({ user: me, status: "authenticated", error: null });
        nioBus.emit("auth:hydrated", { userId: me.id, status: "authenticated" });
      } else {
        removeToken();
        set({ user: null, status: "anonymous" });
        nioBus.emit("auth:hydrated", { userId: null, status: "anonymous" });
      }
    } catch (err) {
      if (isApiError(err) && err.isUnauthorized) {
        removeToken();
      }
      set({ user: null, status: "anonymous" });
      nioBus.emit("auth:hydrated", { userId: null, status: "anonymous" });
    }
  },

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await apiLogin(email, password);
      persistToken(data.access_token ?? data.token ?? "");
      const me = await getMe();
      set({ user: me, status: "authenticated", error: null });
      nioBus.emit("auth:login", { userId: me?.id ?? "", email });
    } catch (err) {
      const message =
        isApiError(err) && err.isValidation
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Login failed";
      set({ status: "anonymous", error: message });
      nioBus.emit("auth:error", { message });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ status: "loading", error: null });
    try {
      const data = await apiRegister(email, password, displayName);
      persistToken(data.access_token ?? data.token ?? "");
      const me = await getMe();
      set({ user: me, status: "authenticated", error: null });
    } catch (err) {
      const message =
        isApiError(err) && err.isValidation
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Registration failed";
      set({ status: "anonymous", error: message });
      throw err;
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, status: "anonymous", error: null });
    nioBus.emit("auth:logout", {});
  },

  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectUser = (s: AuthState) => s.user;
export const selectAuthStatus = (s: AuthState) => s.status;
export const selectAuthError = (s: AuthState) => s.error;
export const selectIsAuthenticated = (s: AuthState) => s.status === "authenticated";
export const selectIsAuthLoading = (s: AuthState) =>
  s.status === "loading" || s.status === "idle";

// Re-export for convenience so old `useAuth()` exports keep working
export { isTokenStale };

// ---------------------------------------------------------------------------
// Event bus: handle external logout triggers (e.g. 401 from api-client)
// ---------------------------------------------------------------------------

nioBus.on("auth:logout", () => {
  const state = useAuthStore.getState();
  if (state.status !== "anonymous") {
    removeToken();
    useAuthStore.setState({ user: null, status: "anonymous", error: null });
  }
});
