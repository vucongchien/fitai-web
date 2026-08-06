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
import { CalibrationView } from "@/features/workout/ui/live/calibration-view";
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
  const {
    cameraBranch,
    exercise,
    finishSet,
    finishSession,
    online,
    setManualForSet,
    spec,
    startSet,
    step,
  } = workoutEffects;

  const onBack = useCallback(() => void finishSession(true), [finishSession]);
  const onToggleVoice = useCallback(() => setListening((value) => !value), []);

  // An AI set is only ready to run once the engine has loaded and the framing
  // check passes. Starting before that would race `motion.prepare()` and count
  // reps against a model that is not there yet.
  const cameraReady =
    !motion.preparing && motion.kind !== null && Boolean(motion.calibration?.ready);
  const needsCalibration = cameraBranch && !cameraReady;

  // The redesigned screens have no "start set" control: arriving at a step *is*
  // the intent to work. Without this the hold clock never runs, `+10s` has no
  // clock to extend and the camera never begins counting reps.
  const sessionStatus = session.status;
  useEffect(() => {
    if (sessionStatus === "ready" && !needsCalibration) startSet(listening);
  }, [listening, needsCalibration, sessionStatus, startSet]);

  // These three notices lived in the deleted `SessionShell`. The screens are
  // fixed-height with no room for a banner row, so they speak as toasts — but
  // they must still speak: the protection note is a post-injury safety message
  // (ux-flow-spec §6.7, BR-AC-09), not decoration.
  useEffect(() => {
    if (!online) toast.info("Offline Mode: You're offline. Sets are saved locally.");
  }, [online]);

  const durationWarning =
    session.duration === "long" || session.duration === "very-long"
      ? "This session has run long. Want to wrap it up?"
      : null;
  useEffect(() => {
    if (durationWarning) toast.info(`Session Duration: ${durationWarning}`);
  }, [durationWarning]);

  const protectionNote = plan.protectionNote;
  useEffect(() => {
    if (protectionNote) toast.info(`${protectionNote.title}: ${protectionNote.description}`);
  }, [protectionNote]);

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
        setTotalSeconds={session.setTotal}
        totalSets={Math.max(1, exercise.targetSets)}
        voiceOn={listening}
      />

      {/*
        Framing check before an AI set — ux-flow-spec §5.3. It covers the active
        screen rather than replacing it: `CameraStage` owns the <video> element
        that `motion.prepare()` and the calibration loop read from, so unmounting
        the screen would deadlock the check it is trying to run. Manual logging
        stays one tap away, so the camera can never trap the user here.
      */}
      {needsCalibration ? (
        <CalibrationView
          calibration={motion.calibration}
          cameraState={camera.state}
          onRetryPermission={() => void camera.start()}
          onStart={() => startSet(listening)}
          onUseManual={() => setManualForSet(true)}
          recommendedAngle={spec?.recommendedCameraAngle ?? ""}
        />
      ) : null}

      {guideOpen ? (
        <InstructionsSheet exercise={exercise} onClose={() => setGuideOpen(false)} />
      ) : null}
    </>
  );
}
