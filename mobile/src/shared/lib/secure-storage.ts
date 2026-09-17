/**
 * Hardware Secure Storage Adapter
 * Wraps expo-secure-store (iOS Keychain / Android Keystore) for sensitive tokens.
 * Automatically falls back to isolated in-memory storage in test runners.
 */

export const SECURE_KEYS = {
  ACCESS_TOKEN: "fitai_access_token",
  REFRESH_TOKEN: "fitai_refresh_token",
  USER_ID: "fitai_user_id",
} as const;

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
}

const memoryFallback = new Map<string, string>();

async function getNativeSecureStore() {
  try {
    return await import("expo-secure-store");
  } catch {
    return null;
  }
}

export const secureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    const nativeStore = await getNativeSecureStore();
    if (nativeStore && typeof nativeStore.getItemAsync === "function") {
      try {
        return await nativeStore.getItemAsync(key);
      } catch {
        return memoryFallback.get(key) ?? null;
      }
    }
    return memoryFallback.get(key) ?? null;
  },

  async setItemAsync(key: string, value: string): Promise<void> {
    const nativeStore = await getNativeSecureStore();
    if (nativeStore && typeof nativeStore.setItemAsync === "function") {
      try {
        await nativeStore.setItemAsync(key, value);
        return;
      } catch {
        memoryFallback.set(key, value);
        return;
      }
    }
    memoryFallback.set(key, value);
  },

  async deleteItemAsync(key: string): Promise<void> {
    const nativeStore = await getNativeSecureStore();
    if (nativeStore && typeof nativeStore.deleteItemAsync === "function") {
      try {
        await nativeStore.deleteItemAsync(key);
        memoryFallback.delete(key);
        return;
      } catch {
        memoryFallback.delete(key);
        return;
      }
    }
    memoryFallback.delete(key);
  },

  async getAuthTokens(): Promise<AuthTokens> {
    const [accessToken, refreshToken, userId] = await Promise.all([
      this.getItemAsync(SECURE_KEYS.ACCESS_TOKEN),
      this.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),
      this.getItemAsync(SECURE_KEYS.USER_ID),
    ]);

    return { accessToken, refreshToken, userId };
  },

  async setAuthTokens(tokens: {
    accessToken: string;
    refreshToken: string;
    userId: string;
  }): Promise<void> {
    await Promise.all([
      this.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokens.accessToken),
      this.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      this.setItemAsync(SECURE_KEYS.USER_ID, tokens.userId),
    ]);
  },

  async clearAuthTokens(): Promise<void> {
    await Promise.all([
      this.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN),
      this.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN),
      this.deleteItemAsync(SECURE_KEYS.USER_ID),
    ]);
  },
};
