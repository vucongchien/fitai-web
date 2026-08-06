"use client";

import { useCallback, useEffect, useState } from "react";

import { totalExerciseCount } from "@/features/workout/domain/session-flow";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import { useLiveWorkoutEffects } from "@/features/workout/model/use-live-workout-effects";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";
import { toast } from "@/shared/ui/toast";

/** Seconds the "+" button adds — same amount on both screens. */
const ADD_SECONDS = 10;

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen?.().catch(() => {
    // iOS Safari has no Fullscreen API on the document element. The screen is
    // already chrome-free, so failing quietly is the right outcome.
  });
}

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

  const [listening, setListening] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const motion = useMotionEngine({
    onFallback: (reason) => {
      workoutEffects.setManualForSet(true);
      toast.info(
        reason === "low-light"
          ? "Not enough light to track — switching to manual logging."
          : "Camera tracking stopped — switching to manual logging.",
      );
    },
    onFormError: (error) => workoutEffects.playCueByCode(error.code, listening),
  });

  const workoutEffects = useLiveWorkoutEffects({ audio, camera, motion, plan, session });
  const { cameraBranch, exercise, finishSet, finishSession, startSet, step } = workoutEffects;

  const onBack = useCallback(() => void finishSession(true), [finishSession]);
  const onToggleVoice = useCallback(() => setListening((value) => !value), []);

  // The redesigned screens have no "start set" control: arriving at a step *is*
  // the intent to work. Without this the hold clock never runs, `+10s` has no
  // clock to extend and the camera never begins counting reps.
  const sessionStatus = session.status;
  useEffect(() => {
    if (sessionStatus === "ready") startSet(listening);
  }, [listening, sessionStatus, startSet]);

  if (!step || !exercise) {
    return (
      <main className="live-screen live-screen--empty">
        <h1>Wrapping up…</h1>
      </main>
    );
  }

  // `session.step` already points at the *next* step while resting, so
  // `cameraBranch` and `exercise` describe the upcoming exercise on both screens.
  const cameraActive = cameraBranch && cameraOn;
  const cameraStage = cameraActive ? (
    <CameraStage
      alert={Boolean(motion.lastError)}
      onFlip={camera.flip}
      pose={motion.pose}
      state={camera.state}
      videoRef={camera.videoRef}
    />
  ) : null;
  const onToggleCamera = cameraBranch ? () => setCameraOn((value) => !value) : undefined;

  if (session.status === "resting") {
    const next = session.step;
    if (!next) return null;

    return (
      <RestScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        exerciseNumber={next.sessionPosition}
        nextExercise={next.exercise}
        onAddTime={() => session.actions.addRest(ADD_SECONDS)}
        onBack={onBack}
        onSkipRest={session.actions.endRest}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        secondsLeft={session.restLeft}
        totalExercises={totalExerciseCount(plan)}
        totalSeconds={session.restTotal}
        voiceOn={listening}
        workoutTitle={plan.title}
      />
    );
  }

  return (
    <>
      <ActiveExerciseScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        currentSet={step.setNumber}
        exercise={exercise}
        onAddTime={() => session.actions.addSetTime(ADD_SECONDS)}
        onBack={onBack}
        onDone={() => finishSet(listening)}
        onOpenGuide={() => setGuideOpen(true)}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        repCount={cameraActive ? motion.repCount : undefined}
        secondsLeft={session.setLeft}
        totalSets={Math.max(1, exercise.targetSets)}
        voiceOn={listening}
      />

      {guideOpen ? (
        <InstructionsSheet exercise={exercise} onClose={() => setGuideOpen(false)} />
      ) : null}
    </>
  );
}
