"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { startAIAdjustment } from "@/features/roadmap/model/ai-adjustment-store";
import { EMPTY_TELEMETRY } from "@/features/workout/domain/motion-engine";
import type { SetTelemetry } from "@/features/workout/domain/motion-engine";
import { formScore } from "@/features/workout/domain/pose-metrics";
import { countUnverifiedSets } from "@/features/workout/domain/session-guards";
import {
  averageFormScore,
  averageRpe,
  estimateCalories,
  findNewPersonalRecords,
  sessionVolumeKg,
} from "@/features/workout/domain/training-load";
import type {
  AbortReason,
  CueSeverity,
  LiveExercise,
  LiveSessionPlan,
  MotionSpec,
  SessionReport,
  SetLogDraft,
} from "@/features/workout/model/live-session.types";
import { reportStorageKey } from "@/features/workout/model/live-session.types";
import type { AudioCoach } from "@/features/workout/model/use-audio-coach";
import type { useCameraStream } from "@/features/workout/model/use-camera-stream";
import type { LiveSessionController } from "@/features/workout/model/use-live-session";
import type { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import {
  abortWorkoutSession,
  completeWorkoutSession,
  logWorkoutSet,
  syncWorkoutLogs,
} from "@/features/workout/server/workout-actions";
import type { SyncErrorItem } from "@/features/workout/server/workout-actions";
import { toast } from "@/shared/ui/toast";

export function useWorkoutSessionSync({
  audio,
  camera,
  cameraBranch,
  elapsedSecRef,
  exercise,
  motion,
  plan,
  playCueByCode,
  session,
  spec,
}: {
  audio: AudioCoach;
  camera: ReturnType<typeof useCameraStream>;
  cameraBranch: boolean;
  elapsedSecRef: React.RefObject<number>;
  exercise: LiveExercise | null;
  motion: ReturnType<typeof useMotionEngine>;
  plan: LiveSessionPlan;
  playCueByCode: (code: string, listening: boolean) => void;
  session: LiveSessionController;
  spec: MotionSpec | null;
}) {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);
  const { step } = session;

  const pendingErrorsRef = useRef<SyncErrorItem[]>([]);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSyncTimer = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      return;
    }
    syncTimeoutRef.current = setTimeout(() => {
      syncTimeoutRef.current = null;
      if (pendingErrorsRef.current.length > 0 && plan.sessionId) {
        const toSync = [...pendingErrorsRef.current];
        pendingErrorsRef.current = [];
        void syncWorkoutLogs(plan.sessionId, toSync);
      }
    }, 15000);
  }, [plan.sessionId]);

  const recordFormError = useCallback(
    (error: {
      code: string;
      metric?: string;
      message: string;
      severity: CueSeverity;
      source?: "referee-error" | "coach-cue";
    }) => {
      if (!exercise || error.source === "coach-cue") {
        return;
      }
      const isCritical =
        error.severity === 2 ||
        error.code === "ERR_BAR_TRAPPED" ||
        error.code === "ERR_FALL_DETECTED";

      const currentRep = motion.repCount;
      const currentSet = step?.setNumber ?? 1;

      const alreadyQueued = pendingErrorsRef.current.some(
        (e) =>
          e.errorCode === error.code && e.repNumber === currentRep && e.setNumber === currentSet,
      );
      if (alreadyQueued) {
        return;
      }

      pendingErrorsRef.current.push({
        errorCode: error.code,
        exerciseId: exercise.exerciseId,
        repNumber: currentRep,
        setNumber: currentSet,
        severity: isCritical ? "CRITICAL" : "WARNING",
        timestamp: new Date().toISOString(),
      });
      scheduleSync();
    },
    [exercise, motion.repCount, scheduleSync, step?.setNumber],
  );

  const finishSet = useCallback(
    async (
      listening: boolean,
      customData?: { actualReps?: number; actualSeconds?: number; weightKg?: number; rpe?: number },
    ) => {
      if (!exercise || !step) {
        return;
      }
      audio.stopCues();
      playCueByCode("set-end", listening);
      const isCamera = cameraBranch && camera.state === "ready";
      const timed = exercise.durationSeconds > 0;

      let telemetry: SetTelemetry = EMPTY_TELEMETRY;
      if (isCamera) {
        telemetry = await motion.stopSet();
      }

      let actualReps =
        isCamera && telemetry.countedReps > 0
          ? telemetry.countedReps
          : motion.repCount > 0
            ? motion.repCount
            : (exercise.targetReps ?? 10);
      if (timed) {
        actualReps =
          customData?.actualSeconds !== undefined
            ? customData.actualSeconds
            : isCamera && telemetry.countedReps > 0
              ? telemetry.countedReps
              : motion.repCount > 0
                ? motion.repCount
                : exercise.durationSeconds > 0
                  ? exercise.durationSeconds
                  : 30;
      } else if (customData?.actualReps !== undefined) {
        actualReps = customData.actualReps;
      }

      const weightKg =
        customData?.weightKg !== undefined ? customData.weightKg : (exercise.targetWeightKg ?? 0);
      const rpe = customData?.rpe !== undefined ? customData.rpe : 8.0;

      let calculatedFormScore: number | null = null;
      if (isCamera) {
        calculatedFormScore =
          telemetry.formScore !== undefined && telemetry.formScore !== null
            ? telemetry.formScore
            : formScore({
                averageRom: telemetry.averageRom,
                errorCount: telemetry.errorCount,
                repCount: actualReps,
                secondsPerRep: telemetry.secondsPerRep,
              });
      }

      const setDraft: Omit<SetLogDraft, "loggedAt" | "synced"> = {
        actualReps,
        cameraAngle: spec?.recommendedCameraAngle ?? "",
        exerciseId: exercise.exerciseId,
        formScore: calculatedFormScore,
        phase: exercise.phase,
        reps: telemetry.reps,
        rpe,
        setNumber: step.setNumber,
        source: isCamera ? "camera" : "manual",
        targetReps: timed ? exercise.durationSeconds : exercise.targetReps,
        validFrameRatio: isCamera ? telemetry.validFrameRatio : null,
        weightKg,
      };

      session.actions.saveSet(setDraft);

      if (plan.sessionId) {
        void logWorkoutSet(plan.sessionId, {
          ...setDraft,
          loggedAt: Date.now(),
          synced: false,
        })
          .then(() => {
            session.actions.markSetSynced(exercise.exerciseId, step.setNumber);
          })
          .catch((err) => {
            console.warn(`[finishSet] Failed to sync set ${step.setNumber}:`, err);
          });
      }

      if (pendingErrorsRef.current.length > 0 && plan.sessionId) {
        const toSync = [...pendingErrorsRef.current];
        pendingErrorsRef.current = [];
        void syncWorkoutLogs(plan.sessionId, toSync);
      }

      toast.success("Set completed!");
    },
    [
      audio,
      camera.state,
      cameraBranch,
      exercise,
      motion,
      plan.sessionId,
      playCueByCode,
      session.actions,
      spec,
      step,
    ],
  );

  const buildReport = useCallback(
    (sets: SetLogDraft[]): SessionReport => {
      const nameById = new Map(
        [...plan.warmUps, ...plan.mainExercises, ...plan.coolDowns].map((item) => [
          item.exerciseId,
          item.name,
        ]),
      );
      const volume = sessionVolumeKg(sets);
      const durationMin = Math.max(1, Math.round(elapsedSecRef.current / 60));
      return {
        averageFormScore: averageFormScore(sets),
        averageRpe: averageRpe(sets),
        durationMin,
        estimatedCalories: estimateCalories(durationMin, volume),
        hasUnverifiedSets: countUnverifiedSets(sets) > 0,
        personalRecords: findNewPersonalRecords(sets, plan.personalRecords).map((record) => ({
          exerciseId: record.exerciseId,
          name: nameById.get(record.exerciseId) ?? record.exerciseId,
          oneRepMaxKg: Math.round(record.oneRepMaxKg * 10) / 10,
        })),
        recentAvgVolumeKg: plan.recentAvgVolumeKg,
        sessionId: plan.sessionId,
        totalSets: sets.length,
        totalVolumeKg: volume,
      };
    },
    [elapsedSecRef, plan],
  );

  const isFinishingSessionRef = useRef(false);

  const finishSession = useCallback(
    async (confirmOverload: boolean) => {
      if (isFinishingSessionRef.current) {
        return;
      }
      isFinishingSessionRef.current = true;
      const sets = session.loggedSets;
      setFinishing(true);
      audio.stopAll();
      camera.stop();
      motion.dispose();

      try {
        const totals = await completeWorkoutSession(plan.sessionId, sets, confirmOverload);
        const report = buildReport(sets);
        sessionStorage.setItem(
          reportStorageKey(plan.sessionId),
          JSON.stringify({
            ...report,
            averageFormScore: totals.averageFormScore ?? report.averageFormScore,
            averageRpe: totals.averageRpe ?? report.averageRpe,
            totalVolumeKg: totals.totalVolumeKg ?? report.totalVolumeKg,
          }),
        );
        session.actions.clearDraft();
        router.push(`/workouts/live/${plan.sessionId}/summary`, {
          transitionTypes: ["workout-complete"],
        });
      } catch {
        isFinishingSessionRef.current = false;
        setFinishing(false);
        toast.error("Could not save session report. Please try again.");
      }
    },
    [
      audio,
      buildReport,
      camera,
      motion,
      plan.sessionId,
      router,
      session.actions,
      session.loggedSets,
    ],
  );

  const abortSession = useCallback(
    async (reason: AbortReason, note?: string) => {
      setFinishing(true);
      audio.stopAll();
      camera.stop();
      motion.dispose();

      try {
        await abortWorkoutSession(plan.sessionId, reason, note);
        session.actions.clearDraft();
        if (reason === "pain") {
          startAIAdjustment({
            muscleGroup: note
              ? note.length > 20
                ? note.slice(0, 20) + "..."
                : note
              : "Reported Area",
            reason: "injury_reported",
          });
          router.replace(`/workouts/live/${plan.sessionId}/stopped`);
        } else {
          router.replace("/roadmap");
        }
      } catch {
        setFinishing(false);
        toast.error("Could not end the session. Please try again.");
      }
    },
    [audio, camera, motion, plan.sessionId, router, session.actions],
  );

  return {
    abortSession,
    clearSyncTimer,
    finishSession,
    finishSet,
    finishing,
    recordFormError,
  };
}
