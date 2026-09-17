/**
 * Active Workout Session Store with Crash Recovery
 * Zero-useEffect compliant state store backed by synchronous MMKV storage.
 * Automatically persists after every set to protect against app crashes or battery depletion.
 */

import { useSyncExternalStore } from "react";

import { nativeHaptics } from "../../../shared/lib/haptics";
import { offlineQueue } from "../../../shared/lib/offline-queue";
import { appStorage, STORAGE_KEYS } from "../../../shared/lib/storage";

export interface CompletedSet {
  completedAt: number;
  reps: number;
  rpe?: number;
  setNumber: number;
  weightKg: number;
}

export interface WorkoutExerciseItem {
  completedSets: CompletedSet[];
  id: string;
  name: string;
  targetReps: number;
  targetSets: number;
  targetWeightKg: number;
}

export interface ActiveWorkoutSession {
  currentExerciseIndex: number;
  currentSetIndex: number;
  exercises: WorkoutExerciseItem[];
  isCompleted: boolean;
  routineTitle: string;
  sessionId: string;
  startedAt: number;
  totalVolumeKg: number;
}

let session: ActiveWorkoutSession | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const activeWorkoutStore = {
  getSnapshot(): ActiveWorkoutSession | null {
    return session;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init(): ActiveWorkoutSession | null {
    const saved = appStorage.getJSON<ActiveWorkoutSession>(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
    if (saved && !saved.isCompleted) {
      session = saved;
      notify();
      return session;
    }
    return null;
  },

  startSession(
    routineTitle: string,
    exercises: Array<Omit<WorkoutExerciseItem, "completedSets">>,
  ): ActiveWorkoutSession {
    session = {
      currentExerciseIndex: 0,
      currentSetIndex: 1,
      exercises: exercises.map((ex) => ({ ...ex, completedSets: [] })),
      isCompleted: false,
      routineTitle,
      sessionId: `ses_${Date.now()}`,
      startedAt: Date.now(),
      totalVolumeKg: 0,
    };

    appStorage.setJSON(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, session);
    notify();
    return session;
  },

  completeSet(exerciseIndex: number, reps: number, weightKg: number, rpe?: number): void {
    if (!session) {
      return;
    }

    const currentEx = session.exercises[exerciseIndex];
    if (!currentEx) {
      return;
    }

    const setNumber = currentEx.completedSets.length + 1;
    const completedSet: CompletedSet = {
      completedAt: Date.now(),
      reps,
      rpe,
      setNumber,
      weightKg,
    };

    currentEx.completedSets.push(completedSet);
    session.totalVolumeKg += reps * weightKg;

    if (currentEx.completedSets.length >= currentEx.targetSets) {
      if (session.currentExerciseIndex < session.exercises.length - 1) {
        session.currentExerciseIndex++;
        session.currentSetIndex = 1;
      }
    } else {
      session.currentSetIndex = currentEx.completedSets.length + 1;
    }

    // Persist immediately for crash recovery
    appStorage.setJSON(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION, session);

    // Enqueue for offline sync
    offlineQueue.enqueueAction("LOG_SET", {
      completedSet,
      exerciseId: currentEx.id,
      sessionId: session.sessionId,
    });

    void nativeHaptics.setComplete();
    notify();
  },

  finishSession(): ActiveWorkoutSession | null {
    if (!session) {
      return null;
    }

    session.isCompleted = true;
    appStorage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);

    const completed = { ...session };
    session = null;
    notify();
    return completed;
  },

  discardSession(): void {
    session = null;
    appStorage.delete(STORAGE_KEYS.ACTIVE_WORKOUT_SESSION);
    notify();
  },
};

export function useActiveWorkout(): ActiveWorkoutSession | null {
  return useSyncExternalStore(
    activeWorkoutStore.subscribe,
    activeWorkoutStore.getSnapshot,
    activeWorkoutStore.getSnapshot,
  );
}
