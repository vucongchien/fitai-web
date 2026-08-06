"use client";

import { Maximize2, Plus, SkipForward, TriangleAlert, Volume2, VolumeX } from "lucide-react";

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
  exerciseNumber,
  nextExercise,
  onAddTime,
  onBack,
  onReportPain,
  onSkipRest,
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
  /** "Something hurts" — reachable during rest as well as mid-set. */
  onReportPain: () => void;
  onToggleVoice: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onAddTime: () => void;
  onSkipRest: () => void;
}) {
  const actions: HeaderAction[] = [
    {
      icon: <TriangleAlert aria-hidden="true" size={18} />,
      key: "pain",
      label: "Report pain",
      onClick: onReportPain,
      tone: "alert",
    },
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

      {/* The upcoming exercise's demo clip. No camera controls here: nothing is
          being tracked during rest, so a live preview would only mean "you are
          being filmed while you catch your breath". */}
      <ExerciseMedia exercise={nextExercise} />

      <div className="live-next">
        {/* One line instead of a badge plus a separate progress line: "Next"
            and the position are the same thought. */}
        <p className="live-next__badge">
          Next{" "}
          <span className="live-next__count">
            {exerciseNumber}/{totalExercises}
          </span>
        </p>
        <p className="live-next__name">{nextExercise.name}</p>
        <p className="live-next__prescription">{prescriptionLabel(nextExercise)}</p>
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

        {/* The ring's own accessible name already says "rest time remaining",
            so the visible label above it was pure duplication — and it pushed
            the ring down into the home-indicator zone. */}
        <CountdownRing
          display={formatCountdown(Math.max(0, secondsLeft))}
          label="Rest time remaining"
          progress={totalSeconds > 0 ? Math.max(0, secondsLeft) / totalSeconds : null}
          tone="recovery"
        />

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

      <p className="live-rest__note">Next exercise starts automatically at zero.</p>
    </div>
  );
}
