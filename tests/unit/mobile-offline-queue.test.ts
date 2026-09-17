import { beforeEach, describe, expect, it } from "vitest";

import { offlineQueue } from "../../mobile/src/shared/lib/offline-queue";
import {
  appStorage,
  createInMemoryStorage,
  setStorageInstance,
  STORAGE_KEYS,
} from "../../mobile/src/shared/lib/storage";

describe("Mobile Dedicated Offline Outbox Queue & Network Resilience", () => {
  beforeEach(() => {
    setStorageInstance(createInMemoryStorage());
    offlineQueue.clearQueue();
  });

  it("maintains FIFO action ordering when multiple gym actions are queued", () => {
    const act1 = offlineQueue.enqueueAction("LOG_SET", {
      exerciseId: "bench",
      reps: 8,
      weightKg: 80,
    });
    const act2 = offlineQueue.enqueueAction("LOG_SET", {
      exerciseId: "bench",
      reps: 8,
      weightKg: 85,
    });
    const act3 = offlineQueue.enqueueAction("LOG_MEAL", { name: "Whey shake", calories: 140 });

    const queue = offlineQueue.getQueue();
    expect(queue.length).toBe(3);
    expect(queue[0].id).toBe(act1.id);
    expect(queue[1].id).toBe(act2.id);
    expect(queue[2].id).toBe(act3.id);
  });

  it("persists queue to storage so it survives app reboots in basement gyms", () => {
    offlineQueue.enqueueAction("LOG_SET", { reps: 10, weightKg: 100 });

    // Inspect raw storage
    const rawInStorage = appStorage.getJSON<any[]>(STORAGE_KEYS.PENDING_SYNC_QUEUE);
    expect(rawInStorage).toBeDefined();
    expect(rawInStorage?.length).toBe(1);
    expect(rawInStorage?.[0].payload.weightKg).toBe(100);

    // Retrieve again via offlineQueue
    const retrieved = offlineQueue.getQueue();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].type).toBe("LOG_SET");
  });

  it("increments retryCount on failed synchronizations and retains uncompleted actions", async () => {
    offlineQueue.enqueueAction("LOG_SET", { set: 1 });
    offlineQueue.enqueueAction("LOG_SET", { set: 2 });

    // Both fail on first attempt (e.g. gym still has no cell reception)
    const result1 = await offlineQueue.drainQueue(async () => false);
    expect(result1.successCount).toBe(0);
    expect(result1.failedCount).toBe(2);

    let queue = offlineQueue.getQueue();
    expect(queue.length).toBe(2);
    expect(queue[0].retryCount).toBe(1);
    expect(queue[1].retryCount).toBe(1);

    // Now phone steps outside, wifi connects: actions succeed
    const result2 = await offlineQueue.drainQueue(async () => true);
    expect(result2.successCount).toBe(2);
    expect(result2.failedCount).toBe(0);

    queue = offlineQueue.getQueue();
    expect(queue.length).toBe(0);
  });
});
