/**
 * Offline Sync Outbox Queue
 * Ensures zero-data-loss in gyms with weak/no cell reception (basements).
 * Enqueues mutations into local storage and drains them automatically when online.
 */

import { appStorage, STORAGE_KEYS } from "./storage";

export type OfflineActionType = "LOG_SET" | "LOG_MEAL" | "UPDATE_PROFILE";

export interface OfflineAction<T = unknown> {
  createdAt: number;
  id: string;
  payload: T;
  retryCount: number;
  type: OfflineActionType;
}

export const offlineQueue = {
  getQueue(): OfflineAction[] {
    return appStorage.getJSON<OfflineAction[]>(STORAGE_KEYS.PENDING_SYNC_QUEUE, []) || [];
  },

  enqueueAction<T>(type: OfflineActionType, payload: T): OfflineAction<T> {
    const queue = this.getQueue();
    const action: OfflineAction<T> = {
      createdAt: Date.now(),
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      payload,
      retryCount: 0,
      type,
    };

    queue.push(action as OfflineAction);
    appStorage.setJSON(STORAGE_KEYS.PENDING_SYNC_QUEUE, queue);
    return action;
  },

  removeAction(id: string): void {
    const queue = this.getQueue().filter((item) => item.id !== id);
    appStorage.setJSON(STORAGE_KEYS.PENDING_SYNC_QUEUE, queue);
  },

  clearQueue(): void {
    appStorage.setJSON(STORAGE_KEYS.PENDING_SYNC_QUEUE, []);
  },

  async drainQueue(
    handler: (action: OfflineAction) => Promise<boolean>,
  ): Promise<{ failedCount: number; successCount: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) {
      return { failedCount: 0, successCount: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    const remainingActions: OfflineAction[] = [];

    for (const action of queue) {
      try {
        const success = await handler(action);
        if (success) {
          successCount++;
        } else {
          failedCount++;
          remainingActions.push({ ...action, retryCount: action.retryCount + 1 });
        }
      } catch {
        failedCount++;
        remainingActions.push({ ...action, retryCount: action.retryCount + 1 });
      }
    }

    appStorage.setJSON(STORAGE_KEYS.PENDING_SYNC_QUEUE, remainingActions);
    return { failedCount, successCount };
  },
};
