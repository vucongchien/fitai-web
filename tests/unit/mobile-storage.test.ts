import { beforeEach, describe, expect, it } from "vitest";

import { offlineQueue } from "../../mobile/src/shared/lib/offline-queue";
import { SECURE_KEYS, secureStorage } from "../../mobile/src/shared/lib/secure-storage";
import {
  appStorage,
  createInMemoryStorage,
  setStorageInstance,
  STORAGE_KEYS,
} from "../../mobile/src/shared/lib/storage";

describe("Mobile Storage Architecture (MMKV + SecureStore)", () => {
  beforeEach(() => {
    setStorageInstance(createInMemoryStorage());
  });

  describe("KeyValueStorage (Synchronous Fast Store)", () => {
    it("handles string get/set/delete synchronously with 0ms latency", () => {
      expect(appStorage.getString(STORAGE_KEYS.USER_PREFERENCES)).toBeNull();

      appStorage.set(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({ haptics: true, volume: 0.8 }));
      const retrieved = appStorage.getString(STORAGE_KEYS.USER_PREFERENCES);
      expect(retrieved).toContain('"haptics":true');

      appStorage.delete(STORAGE_KEYS.USER_PREFERENCES);
      expect(appStorage.getString(STORAGE_KEYS.USER_PREFERENCES)).toBeNull();
    });

    it("handles JSON serialization and deserialization with fallbacks", () => {
      interface Session {
        exerciseIndex: number;
        sessionId: string;
      }

      const testSession: Session = { sessionId: "ses_123", exerciseIndex: 2 };
      appStorage.setJSON(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, testSession);

      const parsed = appStorage.getJSON<Session>(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
      expect(parsed).toEqual(testSession);

      // Non-existent key returns fallback
      const nonExistent = appStorage.getJSON(STORAGE_KEYS.EXERCISE_CATALOG_CACHE, {
        fallback: true,
      });
      expect(nonExistent).toEqual({ fallback: true });
    });
  });

  describe("SecureStorage (Hardware-backed Token Store)", () => {
    beforeEach(async () => {
      await secureStorage.clearAuthTokens();
    });

    it("stores and retrieves auth tokens securely", async () => {
      const initial = await secureStorage.getAuthTokens();
      expect(initial.accessToken).toBeNull();
      expect(initial.refreshToken).toBeNull();
      expect(initial.userId).toBeNull();

      await secureStorage.setAuthTokens({
        accessToken: "access_token_xyz",
        refreshToken: "refresh_token_xyz",
        userId: "usr_athlete_1",
      });

      const updated = await secureStorage.getAuthTokens();
      expect(updated.accessToken).toBe("access_token_xyz");
      expect(updated.refreshToken).toBe("refresh_token_xyz");
      expect(updated.userId).toBe("usr_athlete_1");

      await secureStorage.clearAuthTokens();
      const cleared = await secureStorage.getAuthTokens();
      expect(cleared.accessToken).toBeNull();
    });

    it("supports granular item get/set/delete", async () => {
      await secureStorage.setItemAsync(SECURE_KEYS.USER_ID, "usr_specific");
      expect(await secureStorage.getItemAsync(SECURE_KEYS.USER_ID)).toBe("usr_specific");

      await secureStorage.deleteItemAsync(SECURE_KEYS.USER_ID);
      expect(await secureStorage.getItemAsync(SECURE_KEYS.USER_ID)).toBeNull();
    });
  });

  describe("Offline Outbox Queue", () => {
    beforeEach(() => {
      offlineQueue.clearQueue();
    });

    it("enqueues actions and preserves them in storage", () => {
      expect(offlineQueue.getQueue()).toEqual([]);

      const action = offlineQueue.enqueueAction("LOG_SET", {
        exerciseId: "bench_press",
        reps: 10,
        weightKg: 80,
      });

      expect(action.id).toBeDefined();
      expect(action.type).toBe("LOG_SET");
      expect(action.retryCount).toBe(0);

      const queue = offlineQueue.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].id).toBe(action.id);
    });

    it("drains queue and removes successful actions", async () => {
      const act1 = offlineQueue.enqueueAction("LOG_SET", { set: 1 });
      const act2 = offlineQueue.enqueueAction("LOG_MEAL", { meal: "chicken" });

      const handler = async (action: { id: string }) => {
        // Mock act1 succeeds, act2 fails
        return action.id === act1.id;
      };

      const result = await offlineQueue.drainQueue(handler);
      expect(result.successCount).toBe(1);
      expect(result.failedCount).toBe(1);

      const remaining = offlineQueue.getQueue();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(act2.id);
      expect(remaining[0].retryCount).toBe(1);
    });
  });
});
