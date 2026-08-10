"use client";

import { useCallback, useEffect, useState } from "react";

import { totalExerciseCount } from "@/features/workout/domain/session-flow";
import { loadRatio, sessionVolumeKg } from "@/features/workout/domain/training-load";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import { useLiveWorkoutEffects } from "@/features/workout/model/use-live-workout-effects";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { ActiveExerciseScreen } from "@/features/workout/ui/live/active-exercise-screen";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { DemoVideoOverlay } from "@/features/workout/ui/live/demo-video-overlay";
import type { EndDialogVariant } from "@/features/workout/ui/live/end-session-dialog";
import { EndSessionDialog } from "@/features/workout/ui/live/end-session-dialog";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { PainReportDialog } from "@/features/workout/ui/live/pain-report-dialog";
import { SetConfirmDialog } from "@/features/workout/ui/live/set-confirm-dialog";
import { RestScreen } from "@/features/workout/ui/live/rest-screen";
import { RuleVoiceModal } from "@/features/workout/ui/live/rule-voice-modal";
import { toast } from "@/shared/ui/toast";

/** Seconds the "+" button adds — same amount on both screens. */
const ADD_SECONDS = 10;

function toggleFullscreen() {
  if (typeof document === "undefined") {
    return;
  }
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  void document.documentElement.requestFullscreen?.().catch(() => {
    // IOS Safari has no Fullscreen API on the document element. The screen is
    // Already chrome-free, so failing quietly is the right outcome.
  });
}

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

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
      // Don't switch to manual logging if playing user video file!
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
      if (!listening) {
        return;
      }
      if (error.severity === 2) {
        audio.speakText(`Cảnh báo: ${error.message}`);
      } else {
        workoutEffects.playCueByCode(error.code, listening);
      }
    },
    onRep: (rep) => {
      if (rep.counted && listening) {
        audio.speakText(`Hoàn thành rep ${rep.count}`);
      }
    },
  });

  const workoutEffects = useLiveWorkoutEffects({ audio, camera, cameraOn, motion, plan, session });
  const {
    abortSession,
    cameraBranch,
    exercise,
    finishSet,
    finishSession,
    online,
    startSet,
    step,
  } = workoutEffects;

  // Back always asks first — mid-set or mid-rest, no exceptions. Leaving a
  // Running session is not something a single stray tap should be able to do,
  // And the dialog is where the user chooses between finishing (which saves and
  // Shows the summary) and stopping early.
  const onBack = useCallback(() => setEndOpen(true), []);
  const onToggleVoice = useCallback(() => {
    setListening((current) => {
      const nextState = !current;
      if (nextState) {
        if (exercise) {
          const textToRead = [
            `Bài tập ${exercise.name}.`,
            exercise.instructions ? `Hướng dẫn thực hiện: ${exercise.instructions}` : "",
            exercise.breathingCue ? `Cách hít thở: ${exercise.breathingCue}` : "",
            exercise.formCues.length > 0 ? `Lưu ý tư thế: ${exercise.formCues.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join(" ");
          audio.speakText(textToRead);
        }
      } else {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      }
      return nextState;
    });
  }, [audio, exercise]);

  // An AI set is only ready to run once the engine has loaded and the framing
  // Check passes. Starting before that would race `motion.prepare()` and count
  // Reps against a model that is not there yet.
  const sessionStatus = session.status;
  const cameraActive = (cameraBranch || Boolean(workoutEffects.spec)) && cameraOn;

  // Auto-start set immediately when arriving at step
  useEffect(() => {
    if (sessionStatus === "ready") {
      startSet(listening);
    }
  }, [listening, sessionStatus, startSet]);

  // These three notices lived in the deleted `SessionShell`. The screens are
  // Fixed-height with no room for a banner row, so they speak as toasts — but
  // They must still speak: the protection note is a post-injury safety message
  // (ux-flow-spec §6.7, BR-AC-09), not decoration.
  useEffect(() => {
    if (!online) {
      toast.info("Offline Mode: You're offline. Sets are saved locally.");
    }
  }, [online]);

  const durationWarning =
    session.duration === "long" || session.duration === "very-long"
      ? "This session has run long. Want to wrap it up?"
      : null;
  useEffect(() => {
    if (durationWarning) {
      toast.info(`Session Duration: ${durationWarning}`);
    }
  }, [durationWarning]);

  const { protectionNote } = plan;
  useEffect(() => {
    if (protectionNote) {
      toast.info(`${protectionNote.title}: ${protectionNote.description}`);
    }
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
  const cameraStage = cameraActive ? (
    <CameraStage
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
    />
  ) : null;
  const onToggleCamera = (cameraBranch || Boolean(workoutEffects.spec)) ? () => setCameraOn((value) => !value) : undefined;

  // The confirmation behind the Back button. With nothing logged there is no
  // Session worth saving, so the dialog offers to cancel instead of "finish".
  const { loggedSets } = session;
  const volumeKg = sessionVolumeKg(loggedSets);
  const endVariant: EndDialogVariant = loggedSets.length === 0 ? "empty" : "complete";
  const endDialog = endOpen ? (
    <EndSessionDialog
      loadRatio={loadRatio(volumeKg, plan.recentAvgVolumeKg)}
      onAbort={(reason) => {
        setEndOpen(false);
        void abortSession(reason);
      }}
      onClose={() => setEndOpen(false)}
      onFinish={(confirmOverload) => {
        setEndOpen(false);
        void finishSession(confirmOverload);
      }}
      totalSets={loggedSets.length}
      variant={endVariant}
    />
  ) : null;

  // Pain is reportable from either screen, so the dialog lives here rather than
  // Inside one of them.
  const painDialog = painOpen ? (
    <PainReportDialog
      onDismiss={() => setPainOpen(false)}
      onStop={(note) => {
        setPainOpen(false);
        void abortSession("pain", note);
      }}
    />
  ) : null;

  const confirmDialog = confirmSetOpen && exercise ? (
    <SetConfirmDialog
      aiCountedReps={cameraActive ? (motion.repCount ?? 0) : 0}
      currentSet={step.setNumber}
      exercise={exercise}
      onClose={() => setConfirmSetOpen(false)}
      onConfirm={(data) => {
        setConfirmSetOpen(false);
        finishSet(listening, {
          actualReps: data.actualReps,
          actualSeconds: data.actualSeconds,
          weightKg: data.weightKg,
          rpe: data.rpe,
        });
      }}
      secondsElapsed={session.setTotal > 0 ? session.setTotal - session.setLeft : 0}
      totalSets={Math.max(1, exercise.targetSets)}
    />
  ) : null;

  if (session.status === "resting") {
    const next = session.step;
    if (!next) {
      return null;
    }

    return (
      <>
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
        {painDialog}
        {endDialog}
        {confirmDialog}
      </>
    );
  }

  return (
    <>
      <ActiveExerciseScreen
        cameraActive={cameraActive}
        cameraSlot={cameraStage}
        currentSet={step.setNumber}
        exercise={exercise}
        metrics={motion.metrics}
        onAddTime={() => session.actions.addSetTime(ADD_SECONDS)}
        onBack={onBack}
        onDone={() => setConfirmSetOpen(true)}
        onOpenGuide={() => setGuideOpen(true)}
        onReportPain={() => setPainOpen(true)}
        onToggleCamera={onToggleCamera}
        onToggleFullscreen={toggleFullscreen}
        onToggleVoice={onToggleVoice}
        onWatchVideo={undefined}
        recommendedAngle={plan.motionSpecs?.[exercise.exerciseId]?.recommendedCameraAngle}
        repCount={cameraActive ? (motion.repCount ?? 0) : 0}
        secondsLeft={session.setLeft}
        setTotalSeconds={session.setTotal}
        totalSets={Math.max(1, exercise.targetSets)}
        voiceOn={listening}
      />

      {confirmDialog}

      {/*
        Framing check before an AI set — ux-flow-spec §5.3. It covers the active
        screen rather than replacing it: `CameraStage` owns the <video> element
        that `motion.prepare()` and the calibration loop read from, so unmounting
        the screen would deadlock the check it is trying to run. `shouldCalibrate`
        keeps it strictly pre-set, so it can never cover a running one. Manual
        logging is one tap away, so the camera can never trap the user here.
      */}


      {guideOpen ? (
        <InstructionsSheet
          exercise={exercise}
          onClose={() => setGuideOpen(false)}
          onWatchVideo={exercise.videoUrl ? () => setVideoOpen(true) : undefined}
        />
      ) : null}

      {videoOpen && exercise.videoUrl ? (
        <DemoVideoOverlay
          name={exercise.name}
          onClose={() => setVideoOpen(false)}
          posterUrl={exercise.thumbnailUrl}
          videoUrl={exercise.videoUrl}
        />
      ) : null}

      <RuleVoiceModal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        spec={workoutEffects.spec}
      />

      {painDialog}
      {endDialog}
    </>
  );
}
