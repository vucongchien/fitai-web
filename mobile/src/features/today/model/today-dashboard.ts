import { useSyncExternalStore } from "react";

export interface MacroTarget {
  carbs: number;
  carbsTarget: number;
  currentCalories: number;
  fat: number;
  fatTarget: number;
  protein: number;
  proteinTarget: number;
  targetCalories: number;
}

export interface TodayWorkoutPreview {
  durationMinutes: number;
  exerciseCount: number;
  id: string;
  isCompleted: boolean;
  title: string;
}

export interface MealItem {
  calories: number;
  id: string;
  isLogged: boolean;
  name: string;
  slot: "BREAKFAST" | "DINNER" | "LUNCH" | "SNACK";
  timeString: string;
}

export interface TodayDashboardState {
  error: string | null;
  isLoading: boolean;
  macros: MacroTarget;
  meals: MealItem[];
  streakDays: number;
  todayWorkout: TodayWorkoutPreview | null;
}

const defaultState: TodayDashboardState = {
  error: null,
  isLoading: false,
  macros: {
    carbs: 180,
    carbsTarget: 250,
    currentCalories: 1650,
    fat: 45,
    fatTarget: 65,
    protein: 130,
    proteinTarget: 160,
    targetCalories: 2200,
  },
  meals: [
    {
      id: "m1",
      calories: 450,
      isLogged: true,
      name: "Yến mạch & Whey Isolate",
      slot: "BREAKFAST",
      timeString: "07:30",
    },
    {
      id: "m2",
      calories: 650,
      isLogged: true,
      name: "Cơm bò xào măng tây",
      slot: "LUNCH",
      timeString: "12:15",
    },
    {
      id: "m3",
      calories: 550,
      isLogged: true,
      name: "Ức gà áp chảo & Khoai lang",
      slot: "DINNER",
      timeString: "19:00",
    },
    {
      id: "m4",
      calories: 0,
      isLogged: false,
      name: "Chưa ghi nhận bữa phụ",
      slot: "SNACK",
      timeString: "21:30",
    },
  ],
  streakDays: 12,
  todayWorkout: {
    durationMinutes: 45,
    exerciseCount: 5,
    id: "chest_hypertrophy_01",
    isCompleted: false,
    title: "Ngực & Tay Sau - Hypertrophy",
  },
};

let state: TodayDashboardState = { ...defaultState };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const todayDashboardStore = {
  getSnapshot(): TodayDashboardState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setLoading(isLoading: boolean): void {
    state = { ...state, isLoading };
    notify();
  },

  setError(error: string | null): void {
    state = { ...state, error, isLoading: false };
    notify();
  },

  setEmpty(): void {
    state = {
      ...state,
      error: null,
      isLoading: false,
      meals: [],
      todayWorkout: null,
    };
    notify();
  },

  reset(): void {
    state = { ...defaultState };
    notify();
  },
};

export function useTodayDashboard(): TodayDashboardState {
  return useSyncExternalStore(
    todayDashboardStore.subscribe,
    todayDashboardStore.getSnapshot,
    todayDashboardStore.getSnapshot,
  );
}
