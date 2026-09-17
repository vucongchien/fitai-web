import { useSyncExternalStore } from "react";

import { secureStorage } from "../../../shared/lib/secure-storage";

export interface AuthUser {
  avatarUrl?: string;
  email: string;
  id: string;
  name: string;
  role: "admin" | "coach" | "user";
}

export interface AuthState {
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
}

let state: AuthState = {
  error: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const authStore = {
  getSnapshot(): AuthState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async init(): Promise<void> {
    state = { ...state, isLoading: true, error: null };
    notify();

    try {
      const tokens = await secureStorage.getAuthTokens();
      if (tokens.accessToken && tokens.userId) {
        state = {
          error: null,
          isAuthenticated: true,
          isLoading: false,
          user: {
            avatarUrl:
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            email: `${tokens.userId}@fitai.app`,
            id: tokens.userId,
            name: "Athlete",
            role: "user",
          },
        };
      } else {
        state = {
          error: null,
          isAuthenticated: false,
          isLoading: false,
          user: null,
        };
      }
    } catch {
      state = {
        error: "Không thể khôi phục phiên đăng nhập",
        isAuthenticated: false,
        isLoading: false,
        user: null,
      };
    } finally {
      notify();
    }
  },

  async fastDevLogin(user: {
    id: string;
    name: string;
    email: string;
    role?: "admin" | "coach" | "user";
  }): Promise<void> {
    state = { ...state, isLoading: true, error: null };
    notify();

    try {
      await secureStorage.setAuthTokens({
        accessToken: `dev_access_${user.id}_${Date.now()}`,
        refreshToken: `dev_refresh_${user.id}_${Date.now()}`,
        userId: user.id,
      });

      state = {
        error: null,
        isAuthenticated: true,
        isLoading: false,
        user: {
          avatarUrl:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role ?? "user",
        },
      };
    } catch {
      state = {
        ...state,
        error: "Đăng nhập thử nghiệm thất bại",
        isLoading: false,
      };
    } finally {
      notify();
    }
  },

  async logout(): Promise<void> {
    state = { ...state, isLoading: true };
    notify();

    try {
      await secureStorage.clearAuthTokens();
      state = {
        error: null,
        isAuthenticated: false,
        isLoading: false,
        user: null,
      };
    } finally {
      notify();
    }
  },
};

export function useAuth(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
}
