import { beforeEach, describe, expect, it, vi } from "vitest";

import { activeWorkoutStore } from "../../mobile/src/features/workout/model/active-workout-store";
import { restTimer } from "../../mobile/src/features/workout/model/rest-timer";
import { offlineQueue } from "../../mobile/src/shared/lib/offline-queue";
import {
  appStorage,
  createInMemoryStorage,
  setStorageInstance,
  STORAGE_KEYS,
} from "../../mobile/src/shared/lib/storage";

describe("Active Workout Store & In-Progress Crash Recovery", () => {
  beforeEach(() => {
    setStorageInstance(createInMemoryStorage());
    offlineQueue.clearQueue();
    activeWorkoutStore.discardSession();
    restTimer.stop();
  });

  describe("Workout Session Flow & Volume Tracking", () => {
    it("starts a workout session and persists to MMKV storage immediately", () => {
      const routine = [
        {
          id: "bench_press",
          name: "Barbell Bench Press",
          targetReps: 8,
          targetSets: 3,
          targetWeightKg: 80,
        },
        {
          id: "incline_db",
          name: "Incline Dumbbell Press",
          targetReps: 10,
          targetSets: 3,
          targetWeightKg: 24,
        },
      ];

      const session = activeWorkoutStore.startSession("Chest Day Power", routine);
      expect(session.sessionId).toBeDefined();
      expect(session.exercises.length).toBe(2);
      expect(session.totalVolumeKg).toBe(0);

      const saved = appStorage.getJSON<typeof session>(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
      expect(saved).toBeDefined();
      expect(saved?.sessionId).toBe(session.sessionId);
    });

    it("completes sets, accumulates volume, enqueues offline actions, and updates storage", () => {
      const routine = [
        {
          id: "bench_press",
          name: "Barbell Bench Press",
          targetReps: 8,
          targetSets: 2,
          targetWeightKg: 80,
        },
      ];

      activeWorkoutStore.startSession("Bench Session", routine);

      // Complete Set 1: 8 reps * 80kg = 640kg
      activeWorkoutStore.completeSet(0, 8, 80, 8);
      let session = activeWorkoutStore.getSnapshot();
      expect(session?.totalVolumeKg).toBe(640);
      expect(session?.exercises[0].completedSets.length).toBe(1);

      // Verify offline queue was updated
      const queue = offlineQueue.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].type).toBe("LOG_SET");

      // Complete Set 2: 8 reps * 80kg = 640kg (Total = 1280kg)
      activeWorkoutStore.completeSet(0, 8, 80, 9);
      session = activeWorkoutStore.getSnapshot();
      expect(session?.totalVolumeKg).toBe(1280);
      expect(session?.exercises[0].completedSets.length).toBe(2);
    });

    it("simulates crash recovery: restores uncompleted workout session from storage", () => {
      const routine = [
        { id: "squat", name: "Back Squat", targetReps: 5, targetSets: 3, targetWeightKg: 120 },
      ];

      activeWorkoutStore.startSession("Leg Day Heavy", routine);
      activeWorkoutStore.completeSet(0, 5, 120, 8.5);

      // Simulate app process kill/crash: discard in-memory session reference without clearing storage
      const savedInStorage = appStorage.getJSON(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
      expect(savedInStorage).toBeDefined();

      // App reboots: calls activeWorkoutStore.init()
      const recovered = activeWorkoutStore.init();
      expect(recovered).toBeDefined();
      expect(recovered?.routineTitle).toBe("Leg Day Heavy");
      expect(recovered?.totalVolumeKg).toBe(600);
      expect(recovered?.exercises[0].completedSets[0].weightKg).toBe(120);
    });

    it("clears storage when session is finished or discarded", () => {
      const routine = [
        { id: "curl", name: "Bicep Curl", targetReps: 12, targetSets: 1, targetWeightKg: 15 },
      ];

      activeWorkoutStore.startSession("Arm Blast", routine);
      activeWorkoutStore.completeSet(0, 12, 15);

      const summary = activeWorkoutStore.finishSession();
      expect(summary?.isCompleted).toBe(true);
      expect(summary?.totalVolumeKg).toBe(180);

      expect(appStorage.getJSON(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION)).toBeNull();
      expect(activeWorkoutStore.getSnapshot()).toBeNull();
    });
  });

  describe("Rest Timer", () => {
    it("starts rest timer countdown and formats time properly", () => {
      vi.useFakeTimers();

      restTimer.start(90);
      let state = restTimer.getSnapshot();
      expect(state.isActive).toBe(true);
      expect(state.secondsRemaining).toBe(90);
      expect(state.formattedTime).toBe("1:30");

      vi.advanceTimersByTime(30000);
      state = restTimer.getSnapshot();
      expect(state.secondsRemaining).toBe(60);
      expect(state.formattedTime).toBe("1:00");

      restTimer.addSeconds(15);
      state = restTimer.getSnapshot();
      expect(state.secondsRemaining).toBe(75);

      restTimer.stop();
      state = restTimer.getSnapshot();
      expect(state.isActive).toBe(false);
      expect(state.secondsRemaining).toBe(0);

      vi.useRealTimers();
    });
  });
});
