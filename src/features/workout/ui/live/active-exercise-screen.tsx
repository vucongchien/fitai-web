"use client";

import { BookOpen, Maximize2, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { formatCountdown } from "@/features/workout/model/use-session-timer";
import { ActiveTimerBar } from "@/features/workout/ui/live/active-timer-bar";
import { CoachingPanel } from "@/features/workout/ui/live/coaching-panel";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";
import { ExerciseMetaRow } from "@/features/workout/ui/live/exercise-meta-row";
import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { SessionHeader } from "@/features/workout/ui/live/session-header";

/** "30 sec" for a hold, "10 reps" (plus load when weighted) for a rep-based set. */
function targetLabel(exercise: LiveExercise): string {
  if (exercise.durationSeconds > 0) return `${exercise.durationSeconds} sec`;
  const reps = `${exercise.targetReps} reps`;
  return exercise.isWeighted ? `${reps} · ${exercise.targetWeightKg} kg` : reps;
}

export function ActiveExerciseScreen({
  cameraActive,
  cameraSlot,
  currentSet,
  exercise,
  onAddTime,
  onBack,
  onDone,
  onOpenGuide,
  onToggleCamera,
  onToggleFullscreen,
  onToggleVoice,
  repCount,
  secondsLeft,
  setTotalSeconds = 0,
  totalSets,
  voiceOn,
}: {
  exercise: LiveExercise;
  currentSet: number;
  totalSets: number;
  secondsLeft: number;
  /**
   * Full length of the running set — the ring's denominator. It grows with
   * "+10s", which `exercise.durationSeconds` cannot. 0 means the set has not
   * started yet, so the prescription stands in.
   */
  setTotalSeconds?: number;
  repCount?: number;
  cameraActive: boolean;
  onToggleCamera?: () => void;
  onBack: () => void;
  onOpenGuide: () => void;
  onToggleVoice: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onDone: () => void;
  onAddTime: () => void;
  cameraSlot?: ReactNode;
}) {
  const actions: HeaderAction[] = [
    {
      icon: <BookOpen aria-hidden="true" size={18} />,
      key: "guide",
      label: "Exercise guide",
      onClick: onOpenGuide,
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

  // Three honest cases, and no fourth:
  //   timed hold          → clock counting down, arc depletes with it
  //   reps + camera count → "4 / 10", arc tracks the count
  //   reps, no camera     → nothing to count and no clock to run. The target
  //                         is already shown by the meta row, so the ring
  //                         (a timer instrument) says so with an em dash
  //                         rather than echoing it, and PRODUCT.md forbids
  //                         inventing evidence, so nothing is faked.
  const timed = exercise.durationSeconds > 0;
  const tracking = !timed && repCount !== undefined && exercise.targetReps > 0;

  const display = timed
    ? formatCountdown(Math.max(0, secondsLeft))
    : tracking
      ? `${repCount} / ${exercise.targetReps}`
      : "—";

  const setTotal = setTotalSeconds > 0 ? setTotalSeconds : exercise.durationSeconds;

  const progress = timed
    ? setTotal > 0
      ? Math.max(0, secondsLeft) / setTotal
      : null
    : tracking
      ? repCount! / exercise.targetReps
      : null;

  return (
    <div className="live-screen">
      <SessionHeader actions={actions} onBack={onBack} title={exercise.name} />

      <ExerciseMedia cameraActive={cameraActive} exercise={exercise} onOpenCamera={onToggleCamera}>
        {cameraSlot}
      </ExerciseMedia>

      <ExerciseMetaRow
        currentSet={currentSet}
        name={exercise.name}
        target={targetLabel(exercise)}
        totalSets={totalSets}
      />

      <CoachingPanel exercise={exercise} />

      <ActiveTimerBar
        disabled={!timed}
        display={display}
        onAddTime={onAddTime}
        onDone={onDone}
        progress={progress}
      />
    </div>
  );
}
