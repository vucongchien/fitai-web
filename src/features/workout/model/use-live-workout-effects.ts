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
  AbortReason,
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
} from "@/features/workout/server/workout-actions";
import { toast } from "@/shared/ui/toast";

export function useLiveWorkoutEffects({
  audio,
  camera,
  cameraOn = true,
  motion,
  plan,
  session,
}: {
  plan: LiveSessionPlan;
  session: LiveSessionController;
  audio: AudioCoach;
  camera: ReturnType<typeof useCameraStream>;
  motion: ReturnType<typeof useMotionEngine>;
  cameraOn?: boolean;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [manualForSet, setManualForSet] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const elapsedSecRef = useRef(session.elapsedSec);
  useEffect(() => {
    elapsedSecRef.current = session.elapsedSec;
  }, [session.elapsedSec]);

  /**
   * Live handles to the two controllers, for effects that must *not* re-run when
   * the controllers change identity.
   *
   * `motion` carries `pose` and `calibration`, which update on every camera frame
   * (~30/s). Depending on the object directly meant the camera-lifecycle effect
   * below tore down and restarted the stream on every frame — `getUserMedia` was
   * being called ~140 times a second, which is what made the screen flicker.
   * The effect should re-run when the *exercise* changes, not when a pose lands.
   */
  const cameraRef = useRef(camera);
  const motionRef = useRef(motion);
  useEffect(() => {
    cameraRef.current = camera;
    motionRef.current = motion;
  });

  const { step } = session;
  const exercise = step?.exercise ?? null;
  const spec: MotionSpec | null = useMemo(
    () => (exercise?.hasAiSupported ? (plan.motionSpecs[exercise.exerciseId] ?? null) : null),
    [exercise, plan.motionSpecs],
  );
  const cameraBranch = Boolean(spec) && !manualForSet;

  // --- Network online/offline listener ---
  useEffect(() => {
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
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
  }, [exerciseId]);

  // --- Camera lifecycle ---
  //
  // Resting is excluded, not just "complete": while resting, `session.step`
  // Already points at the *next* exercise, so an AI-supported one would spin the
  // Camera up — permission prompt, indicator light, pose model — during the one
  // Stretch of the session where nothing is being tracked. Rest is rest; the
  // Camera starts when the set does.
  const sessionStatus = session.status;
  const wantCameraStream = Boolean(spec) && cameraOn && sessionStatus !== "complete" && sessionStatus !== "resting";

  useEffect(() => {
    if (!wantCameraStream || !spec) {
      cameraRef.current.stop();
      return;
    }
    let cancelled = false;
    const cam = cameraRef.current;
    const mot = motionRef.current;

    void (async () => {
      const started = await cam.start();
      if (cancelled) {
        return;
      }
      if (!started) {
        setManualForSet(true);
        toast.info("Camera is unavailable — this set is logged by hand.");
        return;
      }
      const kind = await mot.prepare(spec, cam.videoRef.current);
      if (cancelled) {
        return;
      }
      if (kind === "manual") {
        setManualForSet(true);
        toast.info("AI pose model unavailable — camera preview active with manual logging.");
        return;
      }
      if (kind === "simulated") {
        toast.info("Running camera in demo mode — pose model loading.");
      }
      console.log("[AI Engine] ONNX Pose model prepared successfully. Mode:", kind);
      mot.startSet();
    })();

    return () => {
      cancelled = true;
      motionRef.current.stopCalibration();
    };
    // Keyed on set, cameraOn toggle, and spec readiness.
  }, [exerciseId, sessionStatus, spec, wantCameraStream]);

  // Release the hardware whenever camera is turned off, complete, or resting.
  useEffect(() => {
    if (!wantCameraStream) {
      cameraRef.current.stop();
    }
  }, [wantCameraStream]);

  const lastCueTimesRef = useRef<Record<string, number>>({});

  // --- Audio cue player helper ---
  const playCueByCode = useCallback(
    (code: string, listening: boolean) => {
      if (!listening) {
        return;
      }

      // Check cooldown for warning cues based on spec setup or default 3s
      const nowSec = Date.now() / 1000;
      const cooldownSec = spec?.cueCooldownSec?.[code] ?? (code.startsWith("set-") ? 0 : 3.0);
      const lastTime = lastCueTimesRef.current[code] ?? 0;

      if (nowSec - lastTime < cooldownSec) {
        // Cooldown active according to rule setup — skip duplicate audio/speech
        return;
      }
      lastCueTimesRef.current[code] = nowSec;

      if (spec) {
        const cue = spec.cues.find((entry) => entry.code === code);
        if (cue) {
          audio.playCue(cue, cooldownSec);
          if (cue.text) {
            audio.speakText(cue.text);
          }
          return;
        }
      }
      // Fallback voice cue using TTS when audio MP3 cue is missing or exercise has no AI spec
      if (code === "set-start") {
        const exName = exercise?.name || "bài tập";
        const repsOrTime = exercise?.durationSeconds
          ? `${exercise.durationSeconds} giây`
          : `${exercise?.targetReps ?? 10} cái`;
        const setNum = step?.setNumber ?? 1;
        audio.speakText(`Bắt đầu hiệp ${setNum} bài ${exName}, mục tiêu ${repsOrTime}`);
      } else if (code === "set-end") {
        const setNum = step?.setNumber ?? 1;
        audio.speakText(`Hoàn thành hiệp ${setNum}! Hãy nghỉ ngơi.`);
      } else if (code.startsWith("rule-") || code.length > 0) {
        const msg = code.replace("rule-", "").replace(/-/g, " ");
        audio.speakText(msg);
      }
    },
    [audio, exercise, spec, step],
  );

  // --- Set actions ---
  const startSet = useCallback(
    (listening: boolean) => {
      if (!exercise) {
        return;
      }
      session.actions.startSet(exercise.durationSeconds);
      playCueByCode("set-start", listening);
      if (cameraBranch) {
        motion.stopCalibration();
        motion.startSet();
      }
    },
    [cameraBranch, exercise, motion, playCueByCode, session.actions],
  );

  const finishSet = useCallback(
    (
      listening: boolean,
      customData?: { actualReps?: number; actualSeconds?: number; weightKg?: number; rpe?: number },
    ) => {
      if (!exercise || !step) {
        return;
      }
      playCueByCode("set-end", listening);
      const isCamera = cameraBranch && camera.state === "ready";
      const timed = exercise.durationSeconds > 0;

      let actualReps = isCamera && motion.repCount > 0 ? motion.repCount : (exercise.targetReps ?? 10);
      if (timed) {
        actualReps = customData?.actualSeconds ?? exercise.durationSeconds ?? 30;
      } else if (customData?.actualReps !== undefined) {
        actualReps = customData.actualReps;
      }

      const weightKg =
        customData?.weightKg !== undefined ? customData.weightKg : (exercise.targetWeightKg ?? 0);

      const rpe = customData?.rpe !== undefined ? customData.rpe : 8.0;

      session.actions.saveSet({
        actualReps,
        cameraAngle: spec?.recommendedCameraAngle ?? "",
        exerciseId: exercise.exerciseId,
        formScore: isCamera ? 85 : null,
        phase: exercise.phase,
        reps: [],
        rpe,
        setNumber: step.setNumber,
        source: isCamera ? "camera" : "manual",
        targetReps: timed ? exercise.durationSeconds : exercise.targetReps,
        validFrameRatio: isCamera ? 0.9 : null,
        weightKg,
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

  // Auto finish timed sets (for time-based exercises when clock hits 0)
  useEffect(() => {
    if (session.status !== "working" || !exercise) {
      return;
    }
    if (exercise.durationSeconds > 0 && session.setLeft === 0) {
      finishSet(true);
    }
  }, [exercise, finishSet, session.setLeft, session.status]);

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
        recentAvgVolumeKg: plan.recentAvgVolumeKg,
        sessionId: plan.sessionId,
        totalSets: sets.length,
        totalVolumeKg: volume,
      };
    },
    [plan],
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

  /**
   * Stop the session without saving it as completed — the "pain / out of time /
   * doesn't feel right" branch. No report is written, so there is no summary.
   *
   * A pain stop gets its own destination rather than the roadmap: dropping
   * someone who just got hurt back onto a list of upcoming work reads as a
   * prompt to carry on. `note` is the user's optional description of what hurt.
   */
  const abortSession = useCallback(
    async (reason: AbortReason, note?: string) => {
      setFinishing(true);
      audio.stopAll();
      camera.stop();
      motion.dispose();

      try {
        await abortWorkoutSession(plan.sessionId, reason, note);
        session.actions.clearDraft();
        // Replace(), not push(): the live screen must not be one Back tap away
        // Once the session has been ended.
        if (reason === "pain") {
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

  // Auto close on long timeout or complete status
  const autoClosed = useRef(false);
  useEffect(() => {
    if (session.duration !== "auto-close" || autoClosed.current) {
      return;
    }
    autoClosed.current = true;
    void finishSession(true);
  }, [finishSession, session.duration]);

  useEffect(() => {
    if (session.status !== "complete" || finishing) {
      return;
    }
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
    setManualForSet,
    finishSession,
    abortSession,
  };
}
