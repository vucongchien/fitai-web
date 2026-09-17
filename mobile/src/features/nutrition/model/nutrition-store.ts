import { useSyncExternalStore } from "react";

import { offlineQueue } from "../../../shared/lib/offline-queue";

export interface LoggedMeal {
  calories: number;
  carbs: number;
  fat: number;
  id: string;
  loggedAt: string;
  name: string;
  protein: number;
  slot: "BREAKFAST" | "DINNER" | "LUNCH" | "SNACK";
}

export interface NutritionState {
  error: string | null;
  isLoading: boolean;
  meals: LoggedMeal[];
  targetCalories: number;
  targetCarbs: number;
  targetFat: number;
  targetProtein: number;
}

const initialMeals: LoggedMeal[] = [
  {
    calories: 450,
    carbs: 55,
    fat: 12,
    id: "meal_1",
    loggedAt: "07:30",
    name: "Yến mạch & Whey Isolate",
    protein: 35,
    slot: "BREAKFAST",
  },
  {
    calories: 650,
    carbs: 75,
    fat: 18,
    id: "meal_2",
    loggedAt: "12:15",
    name: "Cơm bò xào măng tây",
    protein: 48,
    slot: "LUNCH",
  },
  {
    calories: 550,
    carbs: 50,
    fat: 15,
    id: "meal_3",
    loggedAt: "19:00",
    name: "Ức gà áp chảo & Khoai lang",
    protein: 47,
    slot: "DINNER",
  },
];

let state: NutritionState = {
  error: null,
  isLoading: false,
  meals: initialMeals,
  targetCalories: 2200,
  targetCarbs: 250,
  targetFat: 65,
  targetProtein: 160,
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const nutritionStore = {
  getSnapshot(): NutritionState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  logMeal(meal: Omit<LoggedMeal, "id" | "loggedAt">): LoggedMeal {
    const newMeal: LoggedMeal = {
      ...meal,
      id: `meal_${Date.now()}`,
      loggedAt: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    state = {
      ...state,
      meals: [...state.meals, newMeal],
    };

    // Enqueue for offline sync
    offlineQueue.enqueueAction("LOG_MEAL", newMeal);

    notify();
    return newMeal;
  },

  deleteMeal(mealId: string): void {
    state = {
      ...state,
      meals: state.meals.filter((m) => m.id !== mealId),
    };
    notify();
  },

  setLoading(isLoading: boolean): void {
    state = { ...state, isLoading };
    notify();
  },

  setError(error: string | null): void {
    state = { ...state, error, isLoading: false };
    notify();
  },
};

export function useNutrition(): NutritionState {
  return useSyncExternalStore(
    nutritionStore.subscribe,
    nutritionStore.getSnapshot,
    nutritionStore.getSnapshot,
  );
}
