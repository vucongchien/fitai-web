/**
 * Exercise Catalog Store
 * In-memory searchable index of exercises with 0ms latency filtering.
 */

import { useSyncExternalStore } from "react";

export interface ExerciseDefinition {
  category: "CARDIO" | "COMPOUND" | "ISOLATION";
  equipment: "BARBELL" | "BODYWEIGHT" | "CABLE" | "DUMBBELL" | "MACHINE";
  id: string;
  name: string;
  secondaryMuscles: string[];
  targetMuscle: "BACK" | "CHEST" | "CORE" | "LEGS" | "SHOULDERS";
  thumbnailUrl: string;
}

const defaultCatalog: ExerciseDefinition[] = [
  {
    category: "COMPOUND",
    equipment: "BARBELL",
    id: "ex_bench_press",
    name: "Barbell Bench Press",
    secondaryMuscles: ["Tay sau", "Vai trước"],
    targetMuscle: "CHEST",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300",
  },
  {
    category: "COMPOUND",
    equipment: "DUMBBELL",
    id: "ex_incline_db_press",
    name: "Incline Dumbbell Press",
    secondaryMuscles: ["Tay sau"],
    targetMuscle: "CHEST",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300",
  },
  {
    category: "COMPOUND",
    equipment: "BARBELL",
    id: "ex_squat",
    name: "Barbell Back Squat",
    secondaryMuscles: ["Đùi sau", "Lưng dưới"],
    targetMuscle: "LEGS",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300",
  },
  {
    category: "COMPOUND",
    equipment: "BARBELL",
    id: "ex_deadlift",
    name: "Conventional Deadlift",
    secondaryMuscles: ["Đùi sau", "Lưng xô"],
    targetMuscle: "BACK",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300",
  },
  {
    category: "COMPOUND",
    equipment: "BODYWEIGHT",
    id: "ex_pull_up",
    name: "Pull Up",
    secondaryMuscles: ["Tay trước"],
    targetMuscle: "BACK",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300",
  },
  {
    category: "COMPOUND",
    equipment: "BARBELL",
    id: "ex_overhead_press",
    name: "Barbell Overhead Press",
    secondaryMuscles: ["Tay sau", "Cầu vai"],
    targetMuscle: "SHOULDERS",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300",
  },
  {
    category: "ISOLATION",
    equipment: "DUMBBELL",
    id: "ex_lateral_raise",
    name: "Dumbbell Lateral Raise",
    secondaryMuscles: [],
    targetMuscle: "SHOULDERS",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300",
  },
  {
    category: "ISOLATION",
    equipment: "BARBELL",
    id: "ex_barbell_curl",
    name: "Barbell Bicep Curl",
    secondaryMuscles: ["Cẳng tay"],
    targetMuscle: "BACK",
    thumbnailUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300",
  },
  {
    category: "ISOLATION",
    equipment: "CABLE",
    id: "ex_tricep_pushdown",
    name: "Cable Tricep Pushdown",
    secondaryMuscles: [],
    targetMuscle: "CHEST",
    thumbnailUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300",
  },
  {
    category: "ISOLATION",
    equipment: "MACHINE",
    id: "ex_leg_extension",
    name: "Leg Extension Machine",
    secondaryMuscles: [],
    targetMuscle: "LEGS",
    thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300",
  },
];

export interface CatalogFilter {
  equipment?: ExerciseDefinition["equipment"] | "ALL";
  query?: string;
  targetMuscle?: ExerciseDefinition["targetMuscle"] | "ALL";
}

let catalog: ExerciseDefinition[] = defaultCatalog;
let activeFilter: CatalogFilter = { equipment: "ALL", query: "", targetMuscle: "ALL" };
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const exerciseCatalogStore = {
  getCatalog(): ExerciseDefinition[] {
    return catalog;
  },

  getFilteredCatalog(): ExerciseDefinition[] {
    return catalog.filter((ex) => {
      if (
        activeFilter.targetMuscle &&
        activeFilter.targetMuscle !== "ALL" &&
        ex.targetMuscle !== activeFilter.targetMuscle
      ) {
        return false;
      }
      if (
        activeFilter.equipment &&
        activeFilter.equipment !== "ALL" &&
        ex.equipment !== activeFilter.equipment
      ) {
        return false;
      }
      if (activeFilter.query) {
        const q = activeFilter.query.toLowerCase();
        return ex.name.toLowerCase().includes(q) || ex.targetMuscle.toLowerCase().includes(q);
      }
      return true;
    });
  },

  setFilter(filter: Partial<CatalogFilter>): void {
    activeFilter = { ...activeFilter, ...filter };
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useExerciseCatalog() {
  const filtered = useSyncExternalStore(
    exerciseCatalogStore.subscribe,
    exerciseCatalogStore.getFilteredCatalog,
    exerciseCatalogStore.getFilteredCatalog,
  );

  return {
    exercises: filtered,
    setFilter: exerciseCatalogStore.setFilter,
  };
}
