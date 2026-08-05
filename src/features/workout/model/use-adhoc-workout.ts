"use client";

import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { AdhocExercise, toAdhocExercise } from "@/features/workout/model/adhoc-types";
import {
  beginWorkoutSession,
  getAdhocConfig,
  getAiRecommendation,
} from "@/shared/api/bff/workout/actions";
import type { ExerciseResult } from "@/shared/api/bff/workout/types";
import { useToast } from "@/shared/ui/toast/toast-context";

export function useAdhocWorkout() {
  const router = useRouter();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [exerciseList, setExerciseList] = useState<AdhocExercise[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<AdhocExercise | null>(null);
  const [targetRpe, setTargetRpe] = useState(6.5);

  const [aiPending, startAiTransition] = useTransition();
  const [configPending, startConfigTransition] = useTransition();
  const [sessionPending, startSessionTransition] = useTransition();

  // Mount + load initial config từ BFF (Server Action)
  useEffect(() => {
    setMounted(true);

    startConfigTransition(async () => {
      const config = await getAdhocConfig();
      setTargetRpe(config.targetRpe);
      setExerciseList(config.defaultExercises.map((ex) => toAdhocExercise(ex)));
    });
  }, []);

  // DND-Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Dynamic Estimates
  const totalSets = exerciseList.reduce((acc, item) => acc + (item.sets || 3), 0);
  const estimatedDuration = Math.max(15, Math.round(totalSets * 2.5));

  // Handlers với useCallback
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExerciseList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDeleteExercise = useCallback(
    (id: string) => {
      setExerciseList((prev) => {
        const index = prev.findIndex((item) => item.id === id);
        if (index === -1) return prev;

        const itemToDelete = prev[index]!;

        // Gọi Global Toast System để hiển thị Toast & nút Undo
        showToast({
          message: `Removed "${itemToDelete.name}"`,
          type: "info",
          action: {
            label: "Undo",
            onClick: () => {
              setExerciseList((currentList) => {
                const restored = [...currentList];
                restored.splice(index, 0, itemToDelete);
                return restored;
              });
            },
          },
        });

        return prev.filter((item) => item.id !== id);
      });
    },
    [showToast],
  );

  const handleAddExercise = useCallback((exercise: ExerciseResult) => {
    setExerciseList((prev) => [...prev, toAdhocExercise(exercise, String(Date.now()))]);
  }, []);

  const handleAiRecommend = useCallback(() => {
    startAiTransition(async () => {
      const result = await getAiRecommendation();
      setExerciseList(
        result.exercises.map((ex) => ({
          ...ex,
          id: `${ex.id}-${Date.now()}`,
        })),
      );
    });
  }, []);

  const handleSaveEdit = useCallback(
    (updated: { sets: number; reps: number; rest: string; weightKg?: number }) => {
      if (!editingExercise) return;
      setExerciseList((prev) =>
        prev.map((item) =>
          item.id === editingExercise.id
            ? {
                ...item,
                ...updated,
                prescription: `${updated.sets} × ${updated.reps}`,
              }
            : item,
        ),
      );
      setEditingExercise(null);
    },
    [editingExercise],
  );

  const handleBeginSession = useCallback(() => {
    const exerciseIds = exerciseList.map((ex) => ex.id.split("-")[0]!);
    startSessionTransition(async () => {
      try {
        const { sessionId } = await beginWorkoutSession(exerciseIds);
        router.push(`/workouts/live/${sessionId}`);
      } catch {
        showToast({ message: "Failed to start session. Please try again.", type: "error" });
      }
    });
  }, [exerciseList, router, showToast]);

  return {
    mounted,
    exerciseList,
    isSearchOpen,
    setIsSearchOpen,
    editingExercise,
    setEditingExercise,
    aiLoading: aiPending,
    configLoading: configPending,
    sessionLoading: sessionPending,
    sensors,
    estimatedDuration,
    targetRpe,
    handleDragEnd,
    handleDeleteExercise,
    handleAddExercise,
    handleAiRecommend,
    handleSaveEdit,
    handleBeginSession,
  };
}
