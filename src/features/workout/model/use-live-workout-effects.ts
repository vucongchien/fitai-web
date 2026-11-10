"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { mapCueToSpokenText } from "@/features/workout/domain/audio-cues";
import { resolveDialogueAssetUrl } from "@/features/workout/domain/motion-asset-url";
import type {
  CoachingStyle,
  CueSeverity,
  LiveSessionPlan,
  MotionSpec,
  VoiceFeedbackMetric,
} from "@/features/workout/model/live-session.types";
import type { AudioCoach } from "@/features/workout/model/use-audio-coach";
import type { useCameraStream } from "@/features/workout/model/use-camera-stream";
import type { LiveSessionController } from "@/features/workout/model/use-live-session";
import type { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { useWorkoutSessionSync } from "@/features/workout/model/use-workout-session-sync";
import { toast } from "@/shared/ui/toast";

const subscribeOnline = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};
const getOnlineSnapshot = () => (typeof navigator === "undefined" ? true : navigator.onLine);
const getOnlineServerSnapshot = () => true;

export function resolveCoachingStyle(): CoachingStyle {
  if (typeof window === "undefined") {
    return "normal";
  }
  const directStyle =
    localStorage.getItem("fitai-coaching-style") || localStorage.getItem("fitai-coach-style");

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
      if (coachStyle === "motivational" || coachStyle === "calm" || coachStyle === "gentle")
        return "gentle";
      if (coachStyle === "scientific" || coachStyle === "balanced" || coachStyle === "normal")
        return "normal";
    }
  } catch {
    // Ignore parse error
  }

  return "normal";
}

const FALLBACK_VIETNAMESE_DIALOGUES: Record<
  string,
  Record<"warning" | "danger", Record<CoachingStyle, string>>
> = {
  depth: {
    danger: {
      gentle: "Cố gắng hạ sâu hơn để cơ bắp kích hoạt tối đa nhé.",
      normal: "Biên độ chuyển động quá ngắn, rep không được tính.",
      strict: "Hạ người sâu xuống! Đừng chỉ nhấp nhẹ!",
    },
    warning: {
      gentle: "Hạ thấp thêm một chút nữa là hoàn hảo bạn nhé.",
      normal: "Chưa đủ biên độ, hãy hạ sâu hơn một chút!",
      strict: "Xuống sâu hơn! Chưa đạt độ sâu tiêu chuẩn!",
    },
  },
  elbow_angle: {
    danger: {
      gentle: "Nghỉ tay một chút và đặt lại góc khuỷu tay vuông góc nhé.",
      normal: "Khớp khuỷu tay bị áp lực quá mức, hãy dừng lại kiểm tra vị trí tay.",
      strict: "Dừng lại chỉnh tay ngay! Tránh chấn thương khớp khuỷu tay!",
    },
    warning: {
      gentle: "Điều chỉnh nhẹ tay một chút cho thoải mái và vững hơn bạn nhé.",
      normal: "Góc khuỷu tay chưa chuẩn, hãy điều chỉnh góc gập tay.",
      strict: "Điều chỉnh khuỷu tay ngay! Đặt tay đúng vị trí chịu lực!",
    },
  },
  err_incorrect_depth: {
    danger: {
      gentle: "Cố gắng hạ sâu hơn để cơ bắp kích hoạt tối đa nhé.",
      normal: "Biên độ chuyển động quá ngắn, rep không được tính.",
      strict: "Hạ người sâu xuống! Đừng chỉ nhấp nhẹ!",
    },
    warning: {
      gentle: "Hạ thấp thêm một chút nữa là hoàn hảo bạn nhé.",
      normal: "Chưa đủ biên độ, hãy hạ sâu hơn một chút!",
      strict: "Xuống sâu hơn! Chưa đạt độ sâu tiêu chuẩn!",
    },
  },
  knee_angle: {
    danger: {
      gentle: "Chú ý điều chỉnh hướng đầu gối theo chiều mũi chân để bảo vệ khớp nhé.",
      normal: "Đầu gối vượt quá mũi chân hoặc khuỳnh ra ngoài quá nhiều.",
      strict: "Chỉnh lại chân ngay! Đừng để đầu gối chịu toàn bộ áp lực!",
    },
    warning: {
      gentle: "Hạ mông thấp hơn một chút nữa để tập vào đùi tốt hơn bạn nhé.",
      normal: "Đầu gối chưa đạt độ sâu chuẩn, hãy hạ thấp mông thêm chút nữa.",
      strict: "Xuống sâu hơn nữa! Đưa mông xuống ngang tầm đầu gối!",
    },
  },
  signed_hip_y_diff: {
    danger: {
      gentle: "Hãy hạ gối xuống nghỉ chút nào, hông bị lệch nhiều làm đau lưng dưới đó.",
      normal: "Võng lưng hoặc chổng mông quá nặng, hãy giữ lưng-hông-chân thẳng hàng.",
      strict: "Đau thắt lưng đấy! Hạ mông xuống hoặc nâng hông lên đường thẳng ngay!",
    },
    warning: {
      gentle: "Hơi võng hông rồi bạn ơi, gồng nhẹ bụng đẩy hông lên bằng vai nhé.",
      normal: "Hông hơi võng hoặc nhô cao, hãy siết chặt mông và bụng để giữ thẳng.",
      strict: "Gồng cơ bụng ngay! Không được để sụp hông!",
    },
  },
};

export function normalizeErrorCodeToMetricKey(code: string, metric?: string): string {
  if (metric && metric.trim().length > 0) {
    return metric.trim().toLowerCase();
  }
  return code
    .trim()
    .toLowerCase()
    .replace(/^err_/, "")
    .replace(/_(too_low|too_high|too_acute|too_obtuse)$/, "");
}

export function resolveVoiceFeedbackCueText(
  feedbacks: Record<string, VoiceFeedbackMetric> | null | undefined,
  code: string,
  severity: CueSeverity,
  style: CoachingStyle,
  fallbackMessage: string,
  metric?: string,
): string {
  const normalizedMetric = normalizeErrorCodeToMetricKey(code, metric);
  const candidates = Array.from(
    new Set([metric, code, normalizedMetric, code.toLowerCase()].filter(Boolean) as string[]),
  );
  const severityKey = severity === 2 ? "danger" : "warning";

  if (feedbacks) {
    for (const key of candidates) {
      const fb = feedbacks[key];
      const block = fb?.severities?.[severityKey];
      if (block?.styles) {
        const text = block.styles[style]?.text ?? block.styles.normal?.text;
        if (text) {
          return text;
        }
      }
    }

    if (severityKey === "danger") {
      for (const key of candidates) {
        const fb = feedbacks[key];
        const warnBlock = fb?.severities?.warning;
        if (warnBlock?.styles) {
          const text = warnBlock.styles[style]?.text ?? warnBlock.styles.normal?.text;
          if (text) {
            return text;
          }
        }
      }
    }
  }

  for (const key of candidates) {
    const entry = FALLBACK_VIETNAMESE_DIALOGUES[key.toLowerCase()];
    if (entry) {
      const text = entry[severityKey]?.[style] ?? entry[severityKey]?.normal;
      if (text) {
        return text;
      }
    }
  }

  return mapCueToSpokenText(fallbackMessage || code, "vi");
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
  const online = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);

  const elapsedSecRef = useRef(session.elapsedSec);
  elapsedSecRef.current = session.elapsedSec;

  const { step } = session;
  const exercise = step?.exercise ?? null;
  const spec: MotionSpec | null = useMemo(
    () => (exercise?.hasAiSupported ? (plan.motionSpecs[exercise.exerciseId] ?? null) : null),
    [exercise, plan.motionSpecs],
  );

  const normalizedDialogueUrl = useMemo(
    () =>
      spec?.dialogueEngineUrl
        ? resolveDialogueAssetUrl(spec.dialogueEngineUrl, spec.exerciseId, exercise?.name)
        : "",
    [exercise?.name, spec],
  );

  const { data: fetchedVoiceFeedbacks } = useQuery({
    enabled: Boolean(normalizedDialogueUrl),
    queryFn: async () => {
      if (!normalizedDialogueUrl) return null;
      try {
        const res = await fetch(normalizedDialogueUrl);
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.voice_feedbacks as Record<string, VoiceFeedbackMetric>) ?? null;
      } catch {
        return null;
      }
    },
    queryKey: ["dialogue-engine", normalizedDialogueUrl],
    staleTime: 5 * 60_000,
  });
  const voiceFeedbacks = fetchedVoiceFeedbacks ?? null;

  const cameraRef = useRef(camera);
  const motionRef = useRef(motion);
  cameraRef.current = camera;
  motionRef.current = motion;

  const exerciseId = exercise?.exerciseId ?? null;
  const [prevExerciseId, setPrevExerciseId] = useState(exerciseId);
  const [manualForSet, setManualForSet] = useState(false);

  if (exerciseId !== prevExerciseId) {
    setPrevExerciseId(exerciseId);
    setManualForSet(false);
  }

  const cameraBranch = Boolean(spec) && !manualForSet;
  const sessionStatus = session.status;
  const wantCameraStream = Boolean(spec) && cameraOn && sessionStatus !== "complete";

  const lastCueTimesRef = useRef<Record<string, number>>({});
  const autoFinishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetCompletedAnnouncedRef = useRef(false);
  const lastTargetRepsRef = useRef<number>(0);

  const playCueByCode = useCallback(
    (code: string, listening: boolean) => {
      if (!listening) {
        return;
      }
      if (session.status !== "working" && !code.startsWith("set-")) {
        return;
      }

      const nowSec = Date.now() / 1000;
      const cooldownSec = spec?.cueCooldownSec?.[code] ?? (code.startsWith("set-") ? 0 : 180.0);
      const lastTime = lastCueTimesRef.current[code] ?? 0;

      if (nowSec - lastTime < cooldownSec) {
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
    [audio, exercise, session.status, spec, step],
  );

  const getCueTextForError = useCallback(
    (code: string, severity: CueSeverity, fallbackMessage: string, metric?: string): string => {
      const style = resolveCoachingStyle();
      const feedbacks = voiceFeedbacks ?? spec?.voiceFeedbacks;
      return resolveVoiceFeedbackCueText(feedbacks, code, severity, style, fallbackMessage, metric);
    },
    [spec?.voiceFeedbacks, voiceFeedbacks],
  );

  const { abortSession, clearSyncTimer, finishSession, finishSet, finishing, recordFormError } =
    useWorkoutSessionSync({
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
    });

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

  const lastCameraKeyRef = useRef<string>("");
  const cameraSyncRunIdRef = useRef(0);
  const autoClosed = useRef(false);

  const syncEffects = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      const activeCameraKey =
        wantCameraStream && spec
          ? `${exerciseId}-${Boolean(spec)}-${cameraOn}-${camera.isCustomVideo}-${camera.customVideoSrc ?? ""}`
          : "";

      if (activeCameraKey !== lastCameraKeyRef.current) {
        lastCameraKeyRef.current = activeCameraKey;
        cameraSyncRunIdRef.current += 1;
        const myRunId = cameraSyncRunIdRef.current;

        if (activeCameraKey) {
          const cam = cameraRef.current;
          const mot = motionRef.current;
          void (async () => {
            const started = await cam.start();
            if (myRunId !== cameraSyncRunIdRef.current) return;
            if (!started && !cam.isCustomVideo) {
              setManualForSet(true);
              toast.info("Camera is unavailable — this set is logged by hand.");
              return;
            }
            setManualForSet(false);
            const kind = await mot.prepare(spec, cam.videoRef.current);
            if (myRunId !== cameraSyncRunIdRef.current) return;
            if (kind === "manual") {
              setManualForSet(true);
              toast.info("AI pose model unavailable — camera preview active with manual logging.");
              return;
            }
            if (session.status === "working") {
              mot.startSet();
            } else if (session.status === "ready") {
              mot.startCalibration();
            }
          })();
        } else {
          cameraRef.current.stop();
          motionRef.current.stopCalibration();
        }
      }

      if (session.status === "resting") {
        motionRef.current.stopCalibration();
      }

      if (session.status === "working" && exercise && exercise.durationSeconds > 0) {
        const targetDuration = session.setTotal > 0 ? session.setTotal : exercise.durationSeconds;
        const verifiedSeconds = cameraBranch ? motion.repCount : 0;
        const reachedTarget = cameraBranch
          ? verifiedSeconds >= targetDuration
          : session.setLeft === 0;

        if (reachedTarget) {
          audio.stopCues();
          const actualSeconds =
            cameraBranch && verifiedSeconds > 0
              ? Math.min(verifiedSeconds, targetDuration)
              : targetDuration;
          void finishSet(true, { actualSeconds });
        }
      }

      if (
        session.status === "working" &&
        exercise &&
        exercise.durationSeconds === 0 &&
        exercise.targetReps > 0 &&
        cameraBranch &&
        motion.repCount >= exercise.targetReps
      ) {
        if (motion.repCount !== lastTargetRepsRef.current) {
          lastTargetRepsRef.current = motion.repCount;
          if (autoFinishTimerRef.current !== null) {
            clearTimeout(autoFinishTimerRef.current);
            autoFinishTimerRef.current = null;
          }
        }

        if (!targetCompletedAnnouncedRef.current) {
          targetCompletedAnnouncedRef.current = true;
          audio.stopCues();
          playCueByCode("set-end", true);
        }

        if (autoFinishTimerRef.current === null) {
          autoFinishTimerRef.current = setTimeout(() => {
            autoFinishTimerRef.current = null;
            if (session.status === "working") {
              void finishSet(true);
            }
          }, 3000);
        }
      } else if (session.status !== "working") {
        targetCompletedAnnouncedRef.current = false;
        lastTargetRepsRef.current = 0;
        if (autoFinishTimerRef.current !== null) {
          clearTimeout(autoFinishTimerRef.current);
          autoFinishTimerRef.current = null;
        }
      }

      if (session.duration === "auto-close" && !autoClosed.current) {
        autoClosed.current = true;
        void finishSession(true);
      }

      if (session.status === "complete" && !finishing) {
        void finishSession(false);
      }

      return () => {
        clearSyncTimer();
        if (autoFinishTimerRef.current !== null) {
          clearTimeout(autoFinishTimerRef.current);
          autoFinishTimerRef.current = null;
        }
      };
    },
    [
      audio,
      camera.customVideoSrc,
      camera.isCustomVideo,
      cameraBranch,
      cameraOn,
      clearSyncTimer,
      exercise,
      exerciseId,
      finishSession,
      finishSet,
      finishing,
      motion.repCount,
      playCueByCode,
      session.duration,
      session.setLeft,
      session.setTotal,
      session.status,
      spec,
      wantCameraStream,
    ],
  );

  return {
    abortSession,
    cameraBranch,
    exercise,
    finishSession,
    finishSet,
    finishing,
    getCueTextForError,
    manualForSet,
    online,
    playCueByCode,
    recordFormError,
    setManualForSet,
    spec,
    startSet,
    step,
    syncEffects,
  };
}
