"use client";

import { Maximize2, Plus, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { formatCountdown } from "@/features/workout/model/use-session-timer";
import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";
import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { SessionHeader } from "@/features/workout/ui/live/session-header";

/** "10 Reps" or "30 Seconds" — title-cased, matching the rest-screen copy. */
function prescriptionLabel(exercise: LiveExercise): string {
  if (exercise.durationSeconds > 0) return `${exercise.durationSeconds} Seconds`;
  return `${exercise.targetReps} Reps`;
}

export function RestScreen({
  cameraActive = false,
  cameraSlot,
  exerciseNumber,
  nextExercise,
  onAddTime,
  onBack,
  onSkipRest,
  onToggleCamera,
  onToggleFullscreen,
  onToggleVoice,
  secondsLeft,
  totalExercises,
  totalSeconds,
  voiceOn,
  workoutTitle,
}: {
  workoutTitle: string;
  nextExercise: LiveExercise;
  exerciseNumber: number;
  totalExercises: number;
  secondsLeft: number;
  /** Full length of this rest, so the ring has a denominator. 0 hides the arc. */
  totalSeconds: number;
  onBack: () => void;
  onToggleVoice: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onAddTime: () => void;
  onSkipRest: () => void;
  onToggleCamera?: () => void;
  cameraActive?: boolean;
  cameraSlot?: ReactNode;
}) {
  const actions: HeaderAction[] = [
    {
      active: voiceOn,
      icon: voiceOn ? (
        <Volume2 aria-hidden="true" size={18} />
      ) : (
        <VolumeX aria-hidden="true" size={18} />
      ),
      key: "voice",
      label: "Voice guide",
      onClick: onToggleVoice,
    },
    {
      icon: <Maximize2 aria-hidden="true" size={18} />,
      key: "fullscreen",
      label: "Fullscreen",
      onClick: onToggleFullscreen,
    },
  ];

  return (
    <div className="live-screen live-screen--rest">
      <SessionHeader actions={actions} onBack={onBack} title={workoutTitle} />

      <ExerciseMedia
        cameraActive={cameraActive}
        exercise={nextExercise}
        onOpenCamera={onToggleCamera}
      >
        {cameraSlot}
      </ExerciseMedia>

      <div className="live-next">
        <span className="live-next__badge">Next Exercise</span>
        <p className="live-next__name">{nextExercise.name}</p>
        <p className="live-next__prescription">{prescriptionLabel(nextExercise)}</p>
        <p className="live-next__progress">
          Exercise {exerciseNumber} of {totalExercises}
        </p>
      </div>

      <div className="live-rest">
        <button
          aria-label="+10 Seconds"
          className="live-timerbar__side"
          onClick={onAddTime}
          type="button"
        >
          <Plus aria-hidden="true" size={20} />
          <span>10s</span>
        </button>

        <div className="live-rest__center">
          <span className="live-rest__label">Rest Time Remaining</span>
          <CountdownRing
            display={formatCountdown(Math.max(0, secondsLeft))}
            label="Rest time remaining"
            progress={totalSeconds > 0 ? Math.max(0, secondsLeft) / totalSeconds : null}
            tone="recovery"
          />
        </div>

        <button
          aria-label="Skip Rest"
          className="live-timerbar__side"
          onClick={onSkipRest}
          type="button"
        >
          <SkipForward aria-hidden="true" size={20} />
          <span>Skip</span>
        </button>
      </div>

      <p className="live-rest__note">
        The next exercise will start automatically when the timer reaches zero.
      </p>
    </div>
  );
}
