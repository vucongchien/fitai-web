"use client";

import { BookOpen, Maximize2, TriangleAlert, Volume2, VolumeX } from "lucide-react";
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
  if (exercise.durationSeconds > 0) {
    return `${exercise.durationSeconds} sec`;
  }
  const reps = `${exercise.targetReps} reps`;
  const weighted = exercise.isWeighted && exercise.targetWeightKg > 0;
  return weighted ? `${reps} · ${exercise.targetWeightKg} kg` : reps;
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
  onReportPain,
  onToggleCamera,
  onToggleFullscreen,
  onToggleVoice,
  onWatchVideo,
  recommendedAngle,
  repCount,
  secondsLeft,
  setTotalSeconds = 0,
  totalSets,
  voiceOn,
}: {
  exercise: LiveExercise;
  currentSet: number;
  totalSets: number;
  recommendedAngle?: string;
  secondsLeft: number;
  setTotalSeconds?: number;
  repCount?: number;
  metrics?: {
    angle: number;
    rom: number;
    phase: string;
    startDeg: number;
    endDeg: number;
  } | null;
  cameraActive: boolean;
  onToggleCamera?: () => void;
  onBack: () => void;
  onOpenGuide: () => void;
  onReportPain: () => void;
  onToggleVoice: () => void;
  onWatchVideo?: () => void;
  voiceOn: boolean;
  onToggleFullscreen: () => void;
  onDone: () => void;
  onAddTime: () => void;
  cameraSlot?: ReactNode;
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

  const timed = exercise.durationSeconds > 0;
  const tracking = !timed && repCount !== undefined && exercise.targetReps > 0;
  const hasInstrument = timed || tracking;

  const display = timed
    ? formatCountdown(Math.max(0, secondsLeft))
    : `${repCount ?? 0} / ${exercise.targetReps}`;

  const ringLabel = timed ? "Time remaining in this set" : "Reps completed in this set";
  const setTotal = setTotalSeconds > 0 ? setTotalSeconds : exercise.durationSeconds;
  const progress = timed
    ? (setTotal > 0 ? Math.max(0, secondsLeft) / setTotal : null)
    : (tracking ? repCount! / exercise.targetReps : null);

  return (
    <div className="live-screen" data-camera-active={cameraActive}>
      <SessionHeader actions={actions} onBack={onBack} title={exercise.name} />

      <ExerciseMedia
        cameraActive={cameraActive}
        exercise={exercise}
        onOpenCamera={onToggleCamera}
        onWatchVideo={onWatchVideo}
      >
        {cameraSlot}
      </ExerciseMedia>

      <ExerciseMetaRow
        currentSet={currentSet}
        name={exercise.name}
        recommendedAngle={recommendedAngle}
        target={targetLabel(exercise)}
        totalSets={totalSets}
      />

      <CoachingPanel exercise={exercise} />

      <ActiveTimerBar
        addSeconds={10}
        display={display}
        hasInstrument={hasInstrument}
        label={ringLabel}
        onAddTime={onAddTime}
        onDone={onDone}
        progress={progress}
        timed={timed}
      />
    </div>
  );
}
