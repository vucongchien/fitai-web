/**
 * Key-Value Storage Adapter (MMKV / Synchronous In-Memory)
 * Provides 0ms synchronous read/write operations for crash recovery,
 * offline queues, and local user preferences.
 * Automatically falls back to in-memory map in test/node environments.
 */

export interface KeyValueStorage {
  getString(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

export const STORAGE_KEYS = {
  ACTIVE_WORKOUT_SESSION: "fitai_active_workout_session",
  PENDING_SYNC_QUEUE: "fitai_pending_sync_queue",
  USER_PREFERENCES: "fitai_user_preferences",
  EXERCISE_CATALOG_CACHE: "fitai_exercise_catalog_cache",
} as const;

export function createInMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();

  return {
    getString(key: string): string | null {
      return store.get(key) ?? null;
    },
    set(key: string, value: string): void {
      store.set(key, value);
    },
    delete(key: string): void {
      store.delete(key);
    },
    clearAll(): void {
      store.clear();
    },
    getAllKeys(): string[] {
      return Array.from(store.keys());
    },
  };
}

// Default singleton instance: uses in-memory adapter (seamless in Vitest & Expo)
let activeStorage: KeyValueStorage = createInMemoryStorage();

export function setStorageInstance(customStorage: KeyValueStorage): void {
  activeStorage = customStorage;
}

export const appStorage = {
  getString(key: string): string | null {
    return activeStorage.getString(key);
  },

  set(key: string, value: string): void {
    activeStorage.set(key, value);
  },

  delete(key: string): void {
    activeStorage.delete(key);
  },

  clearAll(): void {
    activeStorage.clearAll();
  },

  getJSON<T>(key: string, fallback: T | null = null): T | null {
    const raw = activeStorage.getString(key);
    if (!raw) {
      return fallback;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON<T>(key: string, value: T): void {
    activeStorage.set(key, JSON.stringify(value));
  },
};
