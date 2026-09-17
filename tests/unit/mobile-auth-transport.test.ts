import { Code, ConnectError } from "@connectrpc/connect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../../mobile/src/features/auth/model/auth-store";
import {
  authInterceptor,
  getBackendBaseUrl,
  requestTokenRefresh,
} from "../../mobile/src/shared/api/client-transport";
import { SECURE_KEYS, secureStorage } from "../../mobile/src/shared/lib/secure-storage";

describe("Mobile ConnectRPC Transport & Auth Lifecycle", () => {
  beforeEach(async () => {
    await secureStorage.clearAuthTokens();
    await authStore.logout();
  });

  describe("Backend URL Configuration", () => {
    it("returns default fallback url or env configured url", () => {
      const url = getBackendBaseUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe("string");
    });
  });

  describe("Auth Interceptor", () => {
    it("injects Bearer token into headers when token exists in secureStorage", async () => {
      await secureStorage.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, "valid_mock_token_123");

      const mockReq = {
        header: new Headers(),
      } as any;

      const mockNext = vi.fn().mockResolvedValue({ status: "ok" });

      const intercepted = authInterceptor(mockNext);
      const res = await intercepted(mockReq);

      expect(mockReq.header.get("Authorization")).toBe("Bearer valid_mock_token_123");
      expect(mockNext).toHaveBeenCalledWith(mockReq);
      expect(res).toEqual({ status: "ok" });
    });

    it("triggers token refresh on Unauthenticated error", async () => {
      await secureStorage.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, "expired_token");
      await secureStorage.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, "refresh_token_valid");

      const mockReq = {
        header: new Headers(),
      } as any;

      let callCount = 0;
      const mockNext = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new ConnectError("Token expired", Code.Unauthenticated);
        }
        return { status: "refreshed_success" };
      });

      const intercepted = authInterceptor(mockNext);
      const res = await intercepted(mockReq);

      expect(callCount).toBe(2);
      expect(mockReq.header.get("Authorization")).toMatch(/^Bearer refreshed_/);
      expect(res).toEqual({ status: "refreshed_success" });
    });
  });

  describe("Auth Store Lifecycle", () => {
    it("performs fastDevLogin, sets user state, and updates secure storage", async () => {
      const devUser = {
        id: "usr_athlete_dev",
        name: "Pro Lifter",
        email: "lifter@fitai.app",
      };

      await authStore.fastDevLogin(devUser);

      const snapshot = authStore.getSnapshot();
      expect(snapshot.isAuthenticated).toBe(true);
      expect(snapshot.user?.id).toBe("usr_athlete_dev");
      expect(snapshot.user?.name).toBe("Pro Lifter");

      // Verify secure storage has tokens
      const tokens = await secureStorage.getAuthTokens();
      expect(tokens.userId).toBe("usr_athlete_dev");
      expect(tokens.accessToken).toBeDefined();

      // Test logout
      await authStore.logout();
      const afterLogout = authStore.getSnapshot();
      expect(afterLogout.isAuthenticated).toBe(false);
      expect(afterLogout.user).toBeNull();
    });
  });
});
