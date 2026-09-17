/**
 * Profile & Injury Recovery Store
 * Manages athlete biometric stats, pain tracking, and audio/haptic preferences.
 */

import { useSyncExternalStore } from "react";

import { appStorage, STORAGE_KEYS } from "../../../shared/lib/storage";

export interface PainPoint {
  id: string;
  location: string;
  notes?: string;
  severity: "mild" | "moderate" | "severe";
}

export interface UserPreferences {
  cameraAiMode: boolean;
  coachVoiceVolume: number;
  hapticEnabled: boolean;
}

export interface ProfileState {
  bodyFatPercent: number;
  error: string | null;
  heightCm: number;
  isLoading: boolean;
  painPoints: PainPoint[];
  preferences: UserPreferences;
  weightKg: number;
}

const defaultPreferences: UserPreferences = {
  cameraAiMode: true,
  coachVoiceVolume: 0.8,
  hapticEnabled: true,
};

let state: ProfileState = {
  bodyFatPercent: 17.5,
  error: null,
  heightCm: 175,
  isLoading: false,
  painPoints: [
    {
      id: "p1",
      location: "Vai phải (Rotator Cuff)",
      notes: "Hạn chế đẩy ngực dốc quá nặng",
      severity: "mild",
    },
  ],
  preferences:
    appStorage.getJSON<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences) ||
    defaultPreferences,
  weightKg: 74.5,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const profileStore = {
  getSnapshot(): ProfileState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  updatePreferences(updated: Partial<UserPreferences>): void {
    const nextPrefs = { ...state.preferences, ...updated };
    state = { ...state, preferences: nextPrefs };
    appStorage.setJSON(STORAGE_KEYS.USER_PREFERENCES, nextPrefs);
    notify();
  },

  addPainPoint(pain: Omit<PainPoint, "id">): PainPoint {
    const newPain: PainPoint = { ...pain, id: `pain_${Date.now()}` };
    state = { ...state, painPoints: [...state.painPoints, newPain] };
    notify();
    return newPain;
  },

  removePainPoint(id: string): void {
    state = { ...state, painPoints: state.painPoints.filter((p) => p.id !== id) };
    notify();
  },

  updateBodyStats(stats: { bodyFatPercent?: number; heightCm?: number; weightKg?: number }): void {
    state = { ...state, ...stats };
    notify();
  },
};

export function useProfile(): ProfileState {
  return useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getSnapshot,
    profileStore.getSnapshot,
  );
}
