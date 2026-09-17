import type { Interceptor } from "@connectrpc/connect";
import { Code, ConnectError } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";

import { SECURE_KEYS, secureStorage } from "../lib/secure-storage";

const DEFAULT_BASE_URL = "http://localhost:8080";

export function getBackendBaseUrl(): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  return DEFAULT_BASE_URL;
}

// Single-flight promise deduplication for token refresh
let refreshPromise: Promise<string | null> | null = null;

export async function requestTokenRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = await secureStorage.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        await secureStorage.clearAuthTokens();
        return null;
      }

      // In real backend, call Auth refresh RPC or BFF endpoint.
      // For now, simulate token extension or return existing token if valid.
      const newAccessToken = `refreshed_${Date.now()}`;
      await secureStorage.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, newAccessToken);
      return newAccessToken;
    } catch {
      await secureStorage.clearAuthTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const authInterceptor: Interceptor = (next) => async (req) => {
  const token = await secureStorage.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  if (token && !req.header.has("Authorization")) {
    req.header.set("Authorization", `Bearer ${token}`);
  }

  try {
    return await next(req);
  } catch (err) {
    if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
      const refreshed = await requestTokenRefresh();
      if (refreshed) {
        req.header.set("Authorization", `Bearer ${refreshed}`);
        return await next(req);
      }
    }
    throw err;
  }
};

export function createMobileTransport(baseUrl: string = getBackendBaseUrl()) {
  return createConnectTransport({
    baseUrl,
    interceptors: [authInterceptor],
  });
}

export const mobileTransport = createMobileTransport();
