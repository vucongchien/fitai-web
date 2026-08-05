"use client";

import type { AudioCoach } from "@/features/workout/model/use-audio-coach";
import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { GuideToggles } from "@/features/workout/ui/live/guide-toggles";
import { MusicMiniControl } from "@/features/workout/ui/live/music-mini-control";
import { RestView } from "@/features/workout/ui/live/rest-view";
import { SetTimer } from "@/features/workout/ui/live/set-timer";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";

import type { LiveSessionController } from "@/features/workout/model/use-live-session";
import type { useCameraStream } from "@/features/workout/model/use-camera-stream";
import type { useMotionEngine } from "@/features/workout/model/use-motion-engine";

export function ExerciseStage({
  audio,
  camera,
  cameraBranch,
  exercise,
  finishSet,
  listening,
  motion,
  onOpenInstructions,
  onOpenMusic,
  onRestartSet,
  session,
  setListening,
  setWatching,
  watching,
}: {
  exercise: LiveExercise;
  session: LiveSessionController;
  audio: AudioCoach;
  listening: boolean;
  watching: boolean;
  setListening: (fn: (v: boolean) => boolean) => void;
  setWatching: (fn: (v: boolean) => boolean) => void;
  onOpenInstructions: () => void;
  onOpenMusic: () => void;
  onRestartSet: () => void;
  finishSet: () => void;
  cameraBranch: boolean;
  camera: ReturnType<typeof useCameraStream>;
  motion: ReturnType<typeof useMotionEngine>;
}) {
  return (
    <section className="exercise-stage">
      {session.status !== "resting" ? (
        <div className="exercise-stage__tools">
          <GuideToggles
            listening={listening}
            onOpenInstructions={onOpenInstructions}
            onToggleListening={() => setListening((v) => !v)}
            onToggleWatching={() => setWatching((v) => !v)}
            watching={watching}
          />
          <MusicMiniControl audio={audio} onOpenSheet={onOpenMusic} />
        </div>
      ) : null}

      {audio.cueText && listening ? (
        <p className="cue-caption" aria-live="polite">
          {audio.cueText}
        </p>
      ) : null}

      {session.status === "resting" ? (
        <RestView
          nextStep={session.step}
          onAddTime={() => session.actions.addRest(20)}
          onSkip={session.actions.endRest}
          secondsLeft={session.restLeft}
        />
      ) : (
        <SetTimer
          exercise={exercise}
          onFinish={finishSet}
          onRestart={onRestartSet}
          onSkip={session.actions.skipExercise}
          onStart={onRestartSet}
          repCount={cameraBranch ? motion.repCount : undefined}
          running={session.status === "working"}
          secondsLeft={session.setLeft}
        >
          {cameraBranch ? (
            <CameraStage
              alert={Boolean(motion.lastError)}
              onFlip={camera.flip}
              pose={motion.pose}
              state={camera.state}
              videoRef={camera.videoRef}
            />
          ) : null}
        </SetTimer>
      )}
    </section>
  );
}
