"use client";

import { useState } from "react";

import { exercisesOfPhase, PHASE_LABEL } from "@/features/workout/domain/session-flow";
import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { useLiveSession } from "@/features/workout/model/use-live-session";
import { useLiveWorkoutEffects } from "@/features/workout/model/use-live-workout-effects";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { ExerciseStage } from "@/features/workout/ui/live/exercise-stage";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { MusicSheet } from "@/features/workout/ui/live/music-sheet";
import { SessionShell } from "@/features/workout/ui/live/session-shell";
import { VideoGuideOverlay } from "@/features/workout/ui/live/video-guide-overlay";
import { toast } from "@/shared/ui/toast";

type SheetName = "music" | "instructions" | null;

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

  const [watching, setWatching] = useState(false);
  const [listening, setListening] = useState(false);
  const [sheet, setSheet] = useState<SheetName>(null);

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
    startSet,
    step,
    videoExpanded,
    setVideoExpanded,
  } = workoutEffects;

  if (!step || !exercise) {
    return (
      <main className="live-workout__empty">
        <h1>Wrapping up…</h1>
      </main>
    );
  }

  const phaseExercises = exercisesOfPhase(plan, step.phase);
  const totalSets = Math.max(1, exercise.targetSets);

  return (
    <SessionShell
      durationWarning={
        session.duration === "long" || session.duration === "very-long"
          ? "This session has run long. Want to wrap it up?"
          : null
      }
      elapsedSec={session.elapsedSec}
      onEnd={() => void finishSession(true)}
      online={online}
      pendingSyncCount={session.pendingSyncCount}
      phaseLabel={PHASE_LABEL[step.phase]}
      progress={session.progress}
      protectionNote={plan.protectionNote}
      stepLabel={`Exercise ${step.exercisePosition} of ${phaseExercises.length} · set ${step.setNumber}/${totalSets}`}
    >
      <ExerciseStage
        audio={audio}
        camera={camera}
        cameraBranch={cameraBranch}
        exercise={exercise}
        finishSet={() => finishSet(listening)}
        listening={listening}
        motion={motion}
        onOpenInstructions={() => setSheet("instructions")}
        onOpenMusic={() => setSheet("music")}
        onRestartSet={() => startSet(listening)}
        session={session}
        setListening={setListening}
        setWatching={setWatching}
        watching={watching}
      />

      {watching ? (
        <VideoGuideOverlay
          exercise={exercise}
          expanded={videoExpanded}
          onClose={() => setWatching(false)}
          onToggleExpanded={() => setVideoExpanded((v) => !v)}
        />
      ) : null}

      {sheet === "instructions" ? (
        <InstructionsSheet exercise={exercise} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "music" ? <MusicSheet audio={audio} onClose={() => setSheet(null)} /> : null}
    </SessionShell>
  );
}
