"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  CoachingStyle,
  CueSeverity,
  LiveSessionPlan,
  MotionSpec,
  SessionReport,
  SetLogDraft,
  VoiceFeedbackMetric,
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
import { startAIAdjustment } from "@/features/roadmap/model/ai-adjustment-store";
import type { SyncErrorItem } from "@/features/workout/server/workout-actions";
import { toast } from "@/shared/ui/toast";

export function resolveCoachingStyle(): CoachingStyle {
  if (typeof window === "undefined") {
    return "normal";
  }
  const directStyle =
    localStorage.getItem("fitai-coaching-style") ||
    localStorage.getItem("fitai-coach-style");

  if (directStyle) {
    const s = directStyle.toLowerCase();
    if (s === "strict" || s === "direct") return "strict";
    if (s === "gentle" || s === "motivational" || s === "calm") return "gentle";
    if (s === "normal" || s === "scientific" || s === "balanced") return "normal";
  }

  try {
    const onboarding = localStorage.getItem("fitai-onboarding");
    if (onboarding) {
      const parsed = JSON.parse(onboarding);
      const coachStyle = (parsed?.coachStyle || "").toString().toLowerCase();
      if (coachStyle === "strict" || coachStyle === "direct") return "strict";
      if (coachStyle === "motivational" || coachStyle === "calm" || coachStyle === "gentle") return "gentle";
      if (coachStyle === "scientific" || coachStyle === "balanced" || coachStyle === "normal") return "normal";
    }
  } catch {
    // Ignore parse error
  }

  return "normal";
}

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
  const [voiceFeedbacks, setVoiceFeedbacks] = useState<Record<string, VoiceFeedbackMetric> | null>(null);

  const elapsedSecRef = useRef(session.elapsedSec);
  useEffect(() => {
    elapsedSecRef.current = session.elapsedSec;
  }, [session.elapsedSec]);

  const { step } = session;
  const exercise = step?.exercise ?? null;
  const spec: MotionSpec | null = useMemo(
    () => (exercise?.hasAiSupported ? (plan.motionSpecs[exercise.exerciseId] ?? null) : null),
    [exercise, plan.motionSpecs],
  );

const FALLBACK_VIETNAMESE_DIALOGUES: Record<
  string,
  Record<"warning" | "danger", Record<CoachingStyle, string>>
> = {
  signed_hip_y_diff: {
    warning: {
      normal: "Hông hơi võng hoặc nhô cao, hãy siết chặt mông và bụng để giữ thẳng.",
      strict: "Gồng cơ bụng ngay! Không được để sụp hông khi plank!",
      gentle: "Hơi võng hông rồi bạn ơi, gồng nhẹ bụng đẩy hông lên bằng vai nhé.",
    },
    danger: {
      normal: "Võng lưng hoặc chổng mông quá nặng, tư thế plank không còn tác dụng.",
      strict: "Đau thắt lưng đấy! Hạ mông xuống hoặc nâng hông lên đường thẳng ngay!",
      gentle: "Hãy hạ gối xuống nghỉ chút nào, hông bị lệch nhiều làm đau lưng dưới đó.",
    },
  },
  knee_angle: {
    warning: {
      normal: "Đầu gối chưa đạt độ sâu chuẩn, hãy hạ thấp mông thêm chút nữa.",
      strict: "Xuống sâu hơn nữa! Đưa mông xuống ngang tầm đầu gối!",
      gentle: "Hạ mông thấp hơn một chút nữa để tập vào đùi tốt hơn bạn nhé.",
    },
    danger: {
      normal: "Đầu gối vượt quá mũi chân hoặc khuỳnh ra ngoài quá nhiều.",
      strict: "Chỉnh lại chân ngay! Đừng để đầu gối chịu toàn bộ áp lực!",
      gentle: "Chú ý điều chỉnh hướng đầu gối theo chiều mũi chân để bảo vệ khớp nhé.",
    },
  },
  elbow_angle: {
    warning: {
      normal: "Góc khuỷu tay chưa chuẩn, hãy điều chỉnh góc gập tay.",
      strict: "Điều chỉnh khuỷu tay ngay! Đặt tay đúng vị trí chịu lực!",
      gentle: "Điều chỉnh nhẹ tay một chút cho thoải mái và vững hơn bạn nhé.",
    },
    danger: {
      normal: "Khớp khuỷu tay bị áp lực quá mức, hãy dừng lại kiểm tra vị trí tay.",
      strict: "Dừng lại chỉnh tay ngay! Tránh chấn thương khớp khuỷu tay!",
      gentle: "Nghỉ tay một chút và đặt lại góc khuỷu tay vuông góc nhé.",
    },
  },
};

  // Fetch Vietnamese dialogue Engine JSON from spec.dialogueEngineUrl dynamically when spec changes
  useEffect(() => {
    if (!spec?.dialogueEngineUrl) {
      setVoiceFeedbacks(null);
      return;
    }
    let cancelled = false;
    fetch(spec.dialogueEngineUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.voice_feedbacks) {
          setVoiceFeedbacks(data.voice_feedbacks);
        }
      })
      .catch(() => {
        // Fallback silently if dialogue URL is temporarily unreachable
      });

    return () => {
      cancelled = true;
    };
  }, [spec?.dialogueEngineUrl]);

  // Fetch Rule JSON spec on main thread to parse rep_type and phase_detection dynamically
  useEffect(() => {
    const exId = spec?.exerciseId || exercise?.exerciseId;
    if (!spec || !exId) return;
    let cancelled = false;
    const ruleUrls = [
      spec.localRulesUrl,
      `/models/rules/${exId}.json`,
      `/rule/${exId}.json`,
    ].filter(Boolean) as string[];

    (async () => {
      for (const url of ruleUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (!cancelled && data) {
              if (data.rep_type) spec.rep_type = data.rep_type;
              if (data.phase_detection) spec.phase_detection = data.phase_detection;
              return;
            }
          }
        } catch {
          // Try next URL
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exercise?.exerciseId, spec]);

  const cameraRef = useRef(camera);
  const motionRef = useRef(motion);
  useEffect(() => {
    cameraRef.current = camera;
    motionRef.current = motion;
  });

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

      // Check cooldown for warning cues based on spec setup or default 180s (3 minutes)
      const nowSec = Date.now() / 1000;
      const cooldownSec = spec?.cueCooldownSec?.[code] ?? (code.startsWith("set-") ? 0 : 180.0);
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
        const exName = exercise?.name || "exercise";
        const repsOrTime = exercise?.durationSeconds
          ? `${exercise.durationSeconds} seconds`
          : `${exercise?.targetReps ?? 10} reps`;
        const setNum = step?.setNumber ?? 1;
        audio.speakText(`Start set ${setNum} of ${exName}, target ${repsOrTime}`);
      } else if (code === "set-end") {
        const setNum = step?.setNumber ?? 1;
        audio.speakText(`Completed set ${setNum}! Take a rest.`);
      } else if (code.startsWith("rule-") || code.length > 0) {
        const msg = code.replace("rule-", "").replace(/-/g, " ");
        audio.speakText(msg);
      }
    },
    [audio, exercise, spec, step],
  );

  const getCueTextForError = useCallback(
    (code: string, severity: CueSeverity, fallbackMessage: string): string => {
      const style = resolveCoachingStyle();
      const feedbacks = voiceFeedbacks ?? spec?.voiceFeedbacks;
      if (feedbacks) {
        const feedback = feedbacks[code];
        if (feedback?.severities) {
          const severityKey = severity === 2 ? "danger" : "warning";
          const severityBlock = feedback.severities[severityKey];
          if (severityBlock?.styles) {
            const styleContent = severityBlock.styles[style] ?? severityBlock.styles.normal;
            if (styleContent?.text) {
              return styleContent.text;
            }
          }
        }
      }

      // Check in-memory Vietnamese fallback dictionary
      const fallbackEntry = FALLBACK_VIETNAMESE_DIALOGUES[code];
      if (fallbackEntry) {
        const severityKey = severity === 2 ? "danger" : "warning";
        const text = fallbackEntry[severityKey]?.[style] ?? fallbackEntry[severityKey]?.normal;
        if (text) {
          return text;
        }
      }

      // Clean up technical English message text if any remains
      const clean = fallbackMessage
        .replace(/^[0-9>-]+cm:\s*/i, "")
        .replace(/alignment/gi, "đường thẳng")
        .replace(/signed_hip_y_diff/gi, "Võng lưng hoặc chổng mông quá cao");

      return clean;
    },
    [spec, voiceFeedbacks],
  );

  const pendingErrorsRef = useRef<SyncErrorItem[]>([]);

  const recordFormError = useCallback(
    (error: { code: string; message: string; severity: CueSeverity }) => {
      if (!exercise) {
        return;
      }
      const isCritical =
        error.severity === 2 ||
        error.code === "ERR_BAR_TRAPPED" ||
        error.code === "ERR_FALL_DETECTED";

      // Chỉ ghi nhận các lỗi nghiêm trọng (CRITICAL) vào hàng đợi để gửi Backend
      if (!isCritical) {
        return;
      }

      pendingErrorsRef.current.push({
        errorCode: error.code,
        exerciseId: exercise.exerciseId,
        repNumber: motion.repCount,
        setNumber: step?.setNumber ?? 1,
        severity: "CRITICAL",
        timestamp: new Date().toISOString(),
      });
    },
    [exercise, motion.repCount, step?.setNumber],
  );

  // Periodically flush unsynced error logs to backend every 15 seconds
  useEffect(() => {
    if (sessionStatus !== "working" || !plan.sessionId) {
      return;
    }
    const intervalId = setInterval(() => {
      if (pendingErrorsRef.current.length === 0) {
        return;
      }
      const toSync = [...pendingErrorsRef.current];
      pendingErrorsRef.current = [];
      void syncWorkoutLogs(plan.sessionId, toSync);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [plan.sessionId, sessionStatus]);

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
    async (
      listening: boolean,
      customData?: { actualReps?: number; actualSeconds?: number; weightKg?: number; rpe?: number },
    ) => {
      if (!exercise || !step) {
        return;
      }
      // Clear all audio & speech synthesis queue from the current set to prevent lingering/repeating audio
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
        actualReps = customData?.actualSeconds ?? exercise.durationSeconds ?? 30;
      } else if (customData?.actualReps !== undefined) {
        actualReps = customData.actualReps;
      }

      const weightKg =
        customData?.weightKg !== undefined ? customData.weightKg : (exercise.targetWeightKg ?? 0);

      const rpe = customData?.rpe !== undefined ? customData.rpe : 8.0;

      let calculatedFormScore: number | null = null;
      if (isCamera) {
        calculatedFormScore = formScore({
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

      // Directly sync this set and its reps to Backend immediately
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

      // Flush any remaining unsynced errors on set completion
      if (pendingErrorsRef.current.length > 0 && plan.sessionId) {
        const toSync = [...pendingErrorsRef.current];
        pendingErrorsRef.current = [];
        void syncWorkoutLogs(plan.sessionId, toSync);
      }

      toast.success("Set completed!");
    },
    [
      audio,
      cameraBranch,
      camera.state,
      exercise,
      motion,
      playCueByCode,
      plan.sessionId,
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
      audio.stopCues();
      finishSet(true);
    }
  }, [audio, exercise, finishSet, session.setLeft, session.status]);

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
          startAIAdjustment({
            reason: "injury_reported",
            muscleGroup: note ? (note.length > 20 ? note.slice(0, 20) + "..." : note) : "Reported Area",
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
    getCueTextForError,
    recordFormError,
    setManualForSet,
    spec,
    startSet,
    step,
    finishSession,
    abortSession,
  };
}
