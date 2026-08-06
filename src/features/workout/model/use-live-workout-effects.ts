"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { countUnverifiedSets } from "@/features/workout/domain/session-guards";
import {
  averageFormScore,
  averageRpe,
  estimateCalories,
  findNewPersonalRecords,
  sessionVolumeKg,
} from "@/features/workout/domain/training-load";
import type {
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
import { completeWorkoutSession } from "@/features/workout/server/workout-actions";
import { toast } from "@/shared/ui/toast";

export function useLiveWorkoutEffects({
  audio,
  camera,
  motion,
  plan,
  session,
}: {
  plan: LiveSessionPlan;
  session: LiveSessionController;
  audio: AudioCoach;
  camera: ReturnType<typeof useCameraStream>;
  motion: ReturnType<typeof useMotionEngine>;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [manualForSet, setManualForSet] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const elapsedSecRef = useRef(session.elapsedSec);
  useEffect(() => {
    elapsedSecRef.current = session.elapsedSec;
  }, [session.elapsedSec]);

  const step = session.step;
  const exercise = step?.exercise ?? null;
  const spec: MotionSpec | null = useMemo(
    () => (exercise?.hasAiSupported ? (plan.motionSpecs[exercise.exerciseId] ?? null) : null),
    [exercise, plan.motionSpecs],
  );
  const cameraBranch = Boolean(spec) && !manualForSet;

  // --- Network online/offline listener ---
  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // --- Exercise reset ---
  const exerciseId = exercise?.exerciseId ?? null;
  useEffect(() => {
    setManualForSet(false);
    setVideoExpanded(false);
  }, [exerciseId]);

  // --- Camera lifecycle ---
  useEffect(() => {
    if (!cameraBranch || !spec || session.status === "complete") return;
    let cancelled = false;

    void (async () => {
      const started = await camera.start();
      if (cancelled) return;
      if (!started) {
        setManualForSet(true);
        toast.info("Camera is unavailable — this set is logged by hand.");
        return;
      }
      const kind = await motion.prepare(spec, camera.videoRef.current);
      if (cancelled) return;
      if (kind === "manual") {
        setManualForSet(true);
        return;
      }
      if (kind === "simulated") {
        toast.info("Running camera in demo mode — pose model loading.");
      }
      motion.startCalibration();
    })();

    return () => {
      cancelled = true;
      motion.stopCalibration();
    };
  }, [cameraBranch, camera, exerciseId, motion, session.status, spec]);

  useEffect(() => {
    if (!cameraBranch) camera.stop();
  }, [cameraBranch, camera]);

  // --- Audio cue player helper ---
  const playCueByCode = useCallback(
    (code: string, listening: boolean) => {
      if (!listening || !spec) return;
      const cue = spec.cues.find((entry) => entry.code === code);
      if (cue) audio.playCue(cue, spec.cueCooldownSec[code] ?? 0);
    },
    [audio, spec],
  );

  // --- Set actions ---
  const startSet = useCallback(
    (listening: boolean) => {
      if (!exercise) return;
      session.actions.startSet(exercise.durationSeconds);
      playCueByCode("set-start", listening);
      if (cameraBranch) {
        motion.stopCalibration();
        motion.startSet();
      }
    },
    [audio, cameraBranch, exercise, motion, playCueByCode, session.actions],
  );

  const finishSet = useCallback(
    (listening: boolean) => {
      if (!exercise || !step) return;
      playCueByCode("set-end", listening);
      const isCamera = cameraBranch && camera.state === "ready";
      const actualReps =
        isCamera && motion.repCount > 0 ? motion.repCount : (exercise.targetReps ?? 10);

      session.actions.saveSet({
        actualReps,
        cameraAngle: spec?.recommendedCameraAngle ?? "",
        exerciseId: exercise.exerciseId,
        formScore: isCamera ? 85 : null,
        phase: exercise.phase,
        reps: [],
        rpe: null,
        setNumber: step.setNumber,
        source: isCamera ? "camera" : "manual",
        targetReps: exercise.targetReps,
        validFrameRatio: isCamera ? 0.9 : null,
        weightKg: exercise.targetWeightKg ?? 0,
      });

      toast.success("Set completed!");
    },
    [
      cameraBranch,
      camera.state,
      exercise,
      motion.repCount,
      playCueByCode,
      session.actions,
      spec,
      step,
    ],
  );

  // Auto finish timed or reps-based sets
  useEffect(() => {
    if (session.status !== "working" || !exercise) return;
    if (exercise.durationSeconds > 0 && session.setLeft === 0) finishSet(true);
  }, [exercise, finishSet, session.setLeft, session.status]);

  useEffect(() => {
    if (session.status !== "working" || !cameraBranch || !exercise) return;
    if (exercise.targetReps > 0 && motion.repCount >= exercise.targetReps) finishSet(true);
  }, [cameraBranch, exercise, finishSet, motion.repCount, session.status]);

  // --- Session report & completion ---
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
        sessionId: plan.sessionId,
        totalSets: sets.length,
        totalVolumeKg: volume,
      };
    },
    [plan],
  );

  const finishSession = useCallback(
    async (confirmOverload: boolean) => {
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

  // Auto close on long timeout or complete status
  const autoClosed = useRef(false);
  useEffect(() => {
    if (session.duration !== "auto-close" || autoClosed.current) return;
    autoClosed.current = true;
    void finishSession(true);
  }, [finishSession, session.duration]);

  useEffect(() => {
    if (session.status !== "complete" || finishing) return;
    void finishSession(false);
  }, [finishSession, finishing, session.status]);

  return {
    cameraBranch,
    exercise,
    finishSet,
    finishing,
    manualForSet,
    online,
    playCueByCode,
    spec,
    startSet,
    step,
    videoExpanded,
    setManualForSet,
    setVideoExpanded,
    finishSession,
  };
}
