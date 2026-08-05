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

import {
  AdhocExercise,
  isWeightedExercise,
  toAdhocExercise,
} from "@/features/workout/model/adhoc-types";
import { getAdhocConfig, getAiRecommendation } from "@/shared/api/bff/workout/actions";

export function useAdhocWorkout() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [exerciseList, setExerciseList] = useState<AdhocExercise[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<AdhocExercise | null>(null);
  const [targetRpe, setTargetRpe] = useState(6.5);

  // AI Loading state dùng useTransition để không block UI
  const [aiPending, startAiTransition] = useTransition();
  const [configPending, startConfigTransition] = useTransition();

  // Undo Toast State
  const [deletedDraft, setDeletedDraft] = useState<{
    item: AdhocExercise;
    index: number;
  } | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Mount + load initial config từ BFF (Server Action)
  useEffect(() => {
    setMounted(true);

    startConfigTransition(async () => {
      const config = await getAdhocConfig();
      setTargetRpe(config.targetRpe);
      setExerciseList(config.defaultExercises.map((ex) => toAdhocExercise(ex)));
    });
  }, []);

  // Cleanup undo timeout khi unmount chống memory leak
  useEffect(() => {
    return () => {
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }
    };
  }, [undoTimeoutId]);

  // DND-Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Dynamic Estimates
  const totalSets = exerciseList.reduce((acc, item) => acc + (item.sets || 3), 0);
  const estimatedDuration = Math.max(15, Math.round(totalSets * 2.5));

  // Handlers với useCallback để tránh re-render child components thừa
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
        setDeletedDraft({ item: itemToDelete, index });

        if (undoTimeoutId) clearTimeout(undoTimeoutId);
        const tid = setTimeout(() => setDeletedDraft(null), 5000);
        setUndoTimeoutId(tid);

        return prev.filter((item) => item.id !== id);
      });
    },
    [undoTimeoutId],
  );

  const handleUndo = useCallback(() => {
    if (!deletedDraft) return;
    const { item, index } = deletedDraft;
    setExerciseList((prev) => {
      const restored = [...prev];
      restored.splice(index, 0, item);
      return restored;
    });
    setDeletedDraft(null);
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
  }, [deletedDraft, undoTimeoutId]);

  const handleAddExercise = useCallback(
    (rawItem: {
      id: string;
      name: string;
      prescription: string;
      rest: string;
      note: string;
    }) => {
      const newExercise: AdhocExercise = {
        ...rawItem,
        id: `${rawItem.id}-${Date.now()}`,
        sets: 3,
        reps: 10,
        weightKg: isWeightedExercise(rawItem.name) ? 12 : undefined,
      };
      setExerciseList((prev) => [...prev, newExercise]);
    },
    [],
  );

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
    const adhocPlanId = `plan_adhoc_${Date.now()}`;
    router.push(`/workouts/live/adhoc?planId=${adhocPlanId}`);
  }, [router]);

  return {
    mounted,
    exerciseList,
    isSearchOpen,
    setIsSearchOpen,
    editingExercise,
    setEditingExercise,
    aiLoading: aiPending,
    configLoading: configPending,
    deletedDraft,
    sensors,
    estimatedDuration,
    targetRpe,
    handleDragEnd,
    handleDeleteExercise,
    handleUndo,
    handleAddExercise,
    handleAiRecommend,
    handleSaveEdit,
    handleBeginSession,
  };
}
