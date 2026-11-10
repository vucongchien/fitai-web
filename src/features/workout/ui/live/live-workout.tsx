"use client";

import { useCallback, useRef, useState } from "react";

import {
  cancelAllSpeech,
  formatVietnameseRepCount,
  formatVietnameseSecond,
  playSyntheticCueTone,
} from "@/features/workout/domain/audio-cues";
import { totalExerciseCount } from "@/features/workout/domain/session-flow";
import { isTimedExercise } from "@/features/workout/domain/session-guards";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import { useLiveWorkoutEffects } from "@/features/workout/model/use-live-workout-effects";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { LiveWorkoutModals } from "@/features/workout/ui/live/live-workout-modals";
import { PoseStencilOverlay } from "@/features/workout/ui/live/pose-stencil-overlay";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";
import { hapticFeedback } from "@/shared/lib/haptic-feedback";
import { useFullscreenScope } from "@/shared/lib/use-fullscreen-scope";
import { useWakeLock } from "@/shared/lib/use-wake-lock";
import { toast } from "@/shared/ui/toast";

const ADD_SECONDS = 10;

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const { toggleFullscreen } = useFullscreenScope();
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

  const isWorkoutActive = session.status !== "complete";
  useWakeLock({ enabled: isWorkoutActive });

  const [listening, setListening] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [painOpen, setPainOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [confirmSetOpen, setConfirmSetOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  const motion = useMotionEngine({
    onFallback: (reason) => {
      if (camera.isCustomVideo) {
        return;
      }
      workoutEffects.setManualForSet(true);
      toast.info(
        reason === "low-light"
          ? "Not enough light to track — switching to manual logging."
          : "Camera tracking stopped — switching to manual logging.",
      );
    },
    onFormError: (error) => {
      workoutEffects.recordFormError(error);
      if (error.severity === 2) {
        hapticFeedback.formDanger();
      } else {
        hapticFeedback.formWarning();
      }
      if (!listening || confirmSetOpen || session.status !== "working") {
        return;
      }
      const cueText = workoutEffects.getCueTextForError(
        error.code,
        error.severity,
        error.message,
        error.metric,
      );
      const gapSec = error.severity === 2 ? 1.5 : 3.0;
      audio.speakText(cueText, undefined, { cooldownGapSec: gapSec, priority: "error" });
    },
    onRep: (rep) => {
      if (rep.counted && session.status === "working") {
        hapticFeedback.repSuccess();
        if (listening && !confirmSetOpen) {
          const isTimed = isTimedExercise(workoutEffects.exercise, workoutEffects.spec);
          if (isTimed) {
            audio.speakText(formatVietnameseSecond(rep.count), undefined, { priority: "normal" });
          } else {
            audio.speakText(formatVietnameseRepCount(rep.count), undefined, { priority: "normal" });
          }
        }
      }
    },
  });

  const workoutEffects = useLiveWorkoutEffects({ audio, camera, cameraOn, motion, plan, session });
  const { abortSession, cameraBranch, exercise, finishSet, finishSession, online, startSet, step } =
    workoutEffects;

  const onBack = useCallback(() => setEndOpen(true), []);
  const onToggleVoice = useCallback(() => {
    setListening((current) => {
      const nextState = !current;
      if (nextState) {
        if (exercise) {
          const textToRead = [
            `Exercise ${exercise.name}.`,
            exercise.instructions ? `Instructions: ${exercise.instructions}` : "",
            exercise.breathingCue ? `Breathing cue: ${exercise.breathingCue}` : "",
            exercise.formCues.length > 0 ? `Form cues: ${exercise.formCues.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join(" ");
          audio.speakText(textToRead);
        }
      } else {
        cancelAllSpeech();
      }
      return nextState;
    });
  }, [audio, exercise]);

  const sessionStatus = session.status;
  const cameraActive = (cameraBranch || Boolean(workoutEffects.spec)) && cameraOn;

  const durationWarning =
    session.duration === "long" || session.duration === "very-long"
      ? "This session has run long. Want to wrap it up?"
      : null;
  const { protectionNote } = plan;

  const notifiedRef = useRef<{
    durationWarningShown?: string | null;
    offlineShown?: boolean;
    protectionNoteShown?: boolean;
  }>({});

  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startSetRef = useRef(startSet);
  startSetRef.current = startSet;
  const listeningRef = useRef(listening);
  listeningRef.current = listening;
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const triggerStartAfterCountdown = useCallback(() => {
    motion.stopCalibration();
    if (prepTimerRef.current !== null) {
      clearInterval(prepTimerRef.current);
    }
    setPrepCountdown(3);
    playSyntheticCueTone("good");
    let count = 3;
    prepTimerRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setPrepCountdown(count);
        playSyntheticCueTone("good");
      } else {
        if (prepTimerRef.current !== null) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
        }
        setPrepCountdown(null);
        playSyntheticCueTone("start");
        startSetRef.current(listeningRef.current);
      }
    }, 1000);
  }, [motion]);

  const beginSetImmediately = useCallback(() => {
    motion.stopCalibration();
    if (prepTimerRef.current !== null) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    setPrepCountdown(null);
    playSyntheticCueTone("start");
    startSetRef.current(listeningRef.current);
  }, [motion]);

  const stageRef = useCallback(
    (node: HTMLElement | null) => {
      if (!node) return;

      if (sessionStatus === "ready") {
        if (cameraActive) {
          motion.startCalibration();
        } else {
          startSetRef.current(listeningRef.current);
        }
      } else {
        if (prepTimerRef.current !== null) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
        }
        setPrepCountdown(null);
      }

      if (sessionStatus === "resting" || sessionStatus === "complete") {
        audioRef.current.stopCues();
      }

      if (!online && !notifiedRef.current.offlineShown) {
        notifiedRef.current.offlineShown = true;
        toast.info("Offline Mode: You're offline. Sets are saved locally.");
      } else if (online) {
        notifiedRef.current.offlineShown = false;
      }

      if (durationWarning && notifiedRef.current.durationWarningShown !== durationWarning) {
        notifiedRef.current.durationWarningShown = durationWarning;
        toast.info(`Session Duration: ${durationWarning}`);
      }

      if (protectionNote && !notifiedRef.current.protectionNoteShown) {
        notifiedRef.current.protectionNoteShown = true;
        toast.info(`${protectionNote.title}: ${protectionNote.description}`);
      }

      const cleanupEffects = workoutEffects.syncEffects(node);

      return () => {
        if (prepTimerRef.current !== null) {
          clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
        }
        cleanupEffects?.();
        audio.stopAll();
        camera.stop();
        motion.dispose();
      };
    },
    [
      audio,
      camera,
      cameraActive,
      durationWarning,
      motion,
      online,
      protectionNote,
      sessionStatus,
      workoutEffects,
    ],
  );

  if (!step || !exercise) {
    return (
      <main className="live-screen live-screen--empty">
        <h1>Wrapping up…</h1>
      </main>
    );
  }

  const isPreSetReady = sessionStatus === "ready" && cameraActive;

  const cameraStage = cameraActive ? (
    <CameraStage
      activeErrors={motion.activeErrors}
      alert={Boolean(motion.lastError)}
      customVideoSrc={camera.customVideoSrc}
      isCustomVideo={camera.isCustomVideo}
      onClearCustomVideo={camera.clearCustomVideo}
      onFlip={camera.flip}
      onOpenRuleModal={() => setRuleModalOpen(true)}
      onUploadVideo={camera.loadVideoFile}
      pose={motion.pose}
      state={camera.state}
      videoRef={camera.videoRef}
    >
      {isPreSetReady ? (
        prepCountdown !== null ? (
          <div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-auto cursor-pointer select-none"
            onClick={beginSetImmediately}
            title="Bấm vào bất kỳ đâu để bắt đầu ngay"
          >
            <div className="text-8xl md:text-9xl font-black text-[var(--color-recovery)] drop-shadow-md animate-scale-up">
              {prepCountdown}
            </div>
          </div>
        ) : (
          <PoseStencilOverlay
            exerciseId={exercise.exerciseId}
            exerciseName={exercise.name}
            onAlignedLock={triggerStartAfterCountdown}
            onSkip={beginSetImmediately}
            onSwitchManual={() => workoutEffects.setManualForSet(true)}
            pose={motion.pose}
            recommendedAngle={plan.motionSpecs?.[exercise.exerciseId]?.recommendedCameraAngle}
            rulesUrl={workoutEffects.spec?.localRulesUrl}
            setNumber={step.setNumber}
          />
        )
      ) : null}
    </CameraStage>
  ) : null;

  const onToggleCamera =
    cameraBranch || Boolean(workoutEffects.spec) ? () => setCameraOn((value) => !value) : undefined;

  const secondsElapsed = session.setTotal > 0 ? session.setTotal - session.setLeft : 0;
  const aiCountedReps = cameraActive ? (motion.repCount ?? 0) : 0;

  const modalsProps = {
    aiCountedReps,
    confirmSetOpen,
    currentSet: step.setNumber,
    endOpen,
    exercise,
    guideOpen,
    loggedSets: session.loggedSets,
    onAbortSession: (reason: Parameters<typeof abortSession>[0], note?: string) =>
      void abortSession(reason, note),
    onCloseConfirmSet: () => setConfirmSetOpen(false),
    onCloseEnd: () => setEndOpen(false),
    onCloseGuide: () => setGuideOpen(false),
    onClosePain: () => setPainOpen(false),
    onCloseRuleModal: () => setRuleModalOpen(false),
    onCloseVideo: () => setVideoOpen(false),
    onConfirmSet: (data: {
      actualReps: number;
      actualSeconds: number;
      weightKg: number;
      rpe: number;
    }) => {
      audio.stopCues();
      setConfirmSetOpen(false);
      void finishSet(listening, data);
    },
    onFinishSession: (confirmOverload: boolean) => void finishSession(confirmOverload),
    onOpenVideo: () => setVideoOpen(true),
    painOpen,
    plan,
    ruleModalOpen,
    secondsElapsed,
    spec: workoutEffects.spec,
    videoOpen,
  };

  if (session.status === "resting") {
    const next = session.step;
    if (!next) return null;
    return (
      <div className="live-workout-root contents" ref={stageRef}>
        <RestScreen
          exerciseNumber={next.sessionPosition}
          nextExercise={next.exercise}
          onAddTime={() => session.actions.addRest(ADD_SECONDS)}
          onBack={onBack}
          onReportPain={() => setPainOpen(true)}
          onSkipRest={session.actions.endRest}
          onToggleFullscreen={toggleFullscreen}
          onToggleVoice={onToggleVoice}
          secondsLeft={session.restLeft}
          totalExercises={totalExerciseCount(plan)}
          totalSeconds={session.restTotal}
          voiceOn={listening}
          workoutTitle={plan.title}
        />
        <LiveWorkoutModals {...modalsProps} includeActiveModals={false} />
      </div>
    );
  }

  return (
    <div className="live-workout-root contents" ref={stageRef}>
      <ActiveExerciseScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        currentSet={step.setNumber}
        exercise={exercise}
        metrics={motion.metrics}
        onAddTime={() => session.actions.addSetTime(ADD_SECONDS)}
        onBack={onBack}
        onDone={() => {
          audio.stopCues();
          setConfirmSetOpen(true);
        }}
        onOpenGuide={() => setGuideOpen(true)}
        onReportPain={() => setPainOpen(true)}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        onWatchVideo={undefined}
        recommendedAngle={plan.motionSpecs?.[exercise.exerciseId]?.recommendedCameraAngle}
        repCount={aiCountedReps}
        secondsLeft={session.setLeft}
        setTotalSeconds={session.setTotal}
        spec={workoutEffects.spec}
        totalSets={Math.max(1, exercise.targetSets)}
        voiceOn={listening}
      />
      <LiveWorkoutModals {...modalsProps} includeActiveModals />
    </div>
  );
}
