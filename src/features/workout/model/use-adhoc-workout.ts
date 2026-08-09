"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { AdhocExercise } from "@/features/workout/model/adhoc-types";
import { toAdhocExercise } from "@/features/workout/model/adhoc-types";
import type { ExerciseResult } from "@/features/workout/model/workout.types";
import {
  beginWorkoutSession,
  getAdhocConfig,
} from "@/features/workout/server/workout-actions";
import { useToast } from "@/shared/ui/toast/toast-context";

export function useAdhocWorkout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [exerciseList, setExerciseList] = useState<AdhocExercise[]>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get("exerciseId");
      const targetName = urlParams.get("name") || urlParams.get("exerciseName");
      const targetPrescription = urlParams.get("prescription");

      if (targetId || targetName) {
        const matched: ExerciseResult = {
          id: targetId || `ex-${Date.now()}`,
          name: targetName || "Selected Movement",
          equipmentId: "eq-standard",
          isWeighted: true,
          prescription: targetPrescription || "3 × 10",
          rest: "90 sec",
          note: "",
        };
        return [toAdhocExercise(matched, String(Date.now()))];
      }
    }
    return [];
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<AdhocExercise | null>(null);
  const [targetRpe, setTargetRpe] = useState(6.5);

  const [configPending, startConfigTransition] = useTransition();
  const [sessionPending, startSessionTransition] = useTransition();

  // Mount + load initial config từ BFF / URL searchParams
  useEffect(() => {
    setMounted(true);
    const targetExerciseId = searchParams.get("exerciseId");
    const targetName = searchParams.get("name") || searchParams.get("exerciseName");
    const targetPrescription = searchParams.get("prescription");

    if (targetExerciseId || targetName) {
      const matched: ExerciseResult = {
        id: targetExerciseId || `ex-${Date.now()}`,
        name: targetName || "Selected Movement",
        equipmentId: "eq-standard",
        isWeighted: true,
        prescription: targetPrescription || "3 × 10",
        rest: "90 sec",
        note: "",
      };

      setExerciseList([toAdhocExercise(matched, String(Date.now()))]);
      return;
    }

    startConfigTransition(async () => {
      const config = await getAdhocConfig();
      setTargetRpe(config.targetRpe);
      setExerciseList(config.defaultExercises.map((ex) => toAdhocExercise(ex)));
    });
  }, [searchParams]);

  // DND-Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Dynamic Estimates
  const totalSets = exerciseList.reduce((acc, item) => acc + (item.sets || 3), 0);
  const estimatedDuration =
    exerciseList.length === 0 ? 0 : Math.max(15, Math.round(totalSets * 2.5));

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
        if (index === -1) {
          return prev;
        }

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
    setIsAiModalOpen(true);
  }, []);

  const handleApplyAiExercises = useCallback(
    (newExercises: AdhocExercise[], mode: "replace" | "append") => {
      const previousList = [...exerciseList];
      if (mode === "replace") {
        setExerciseList(newExercises);
      } else {
        setExerciseList((prev) => [...prev, ...newExercises]);
      }

      showToast({
        message:
          mode === "replace"
            ? `Applied AI workout (${newExercises.length} movements)`
            : `Added ${newExercises.length} AI movements`,
        type: "success",
        action: {
          label: "Undo",
          onClick: () => {
            setExerciseList(previousList);
          },
        },
      });
    },
    [exerciseList, showToast],
  );

  const handleSaveEdit = useCallback(
    (updated: { sets: number; reps: number; rest: string; weightKg?: number }) => {
      if (!editingExercise) {
        return;
      }
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
    if (exerciseList.length === 0) {
      showToast({
        message: "Vui lòng chọn ít nhất 1 bài tập trước khi bắt đầu buổi tập.",
        type: "error",
      });
      return;
    }

    const exerciseIds = exerciseList.map(
      (ex) => ex.exerciseId || ex.id.split("__")[0] || ex.id,
    );
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
    isAiModalOpen,
    setIsAiModalOpen,
    aiReasoning,
    setAiReasoning,
    editingExercise,
    setEditingExercise,
    aiLoading: false,
    configLoading: configPending,
    sessionLoading: sessionPending,
    sensors,
    estimatedDuration,
    targetRpe,
    handleDragEnd,
    handleDeleteExercise,
    handleAddExercise,
    handleAiRecommend,
    handleApplyAiExercises,
    handleSaveEdit,
    handleBeginSession,
  };
}
