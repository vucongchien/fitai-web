"use client";

import {
  isAnomalousLoad,
  loadRatio,
  sessionVolumeKg,
} from "@/features/workout/domain/training-load";
import type {
  AbortReason,
  LiveExercise,
  LiveSessionPlan,
  MotionSpec,
  SetLogDraft,
} from "@/features/workout/model/live-session.types";
import { DemoVideoOverlay } from "@/features/workout/ui/live/demo-video-overlay";
import type { EndDialogVariant } from "@/features/workout/ui/live/end-session-dialog";
import { EndSessionDialog } from "@/features/workout/ui/live/end-session-dialog";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { PainReportDialog } from "@/features/workout/ui/live/pain-report-dialog";
import { RuleVoiceModal } from "@/features/workout/ui/live/rule-voice-modal";
import type { SetConfirmData } from "@/features/workout/ui/live/set-confirm-dialog";
import { SetConfirmDialog } from "@/features/workout/ui/live/set-confirm-dialog";

export interface LiveWorkoutModalsProps {
  aiCountedReps: number;
  confirmSetOpen: boolean;
  currentSet: number;
  endOpen: boolean;
  exercise: LiveExercise;
  guideOpen: boolean;
  includeActiveModals?: boolean;
  loggedSets: SetLogDraft[];
  onAbortSession: (reason: AbortReason, note?: string) => void;
  onCloseConfirmSet: () => void;
  onCloseEnd: () => void;
  onCloseGuide: () => void;
  onClosePain: () => void;
  onCloseRuleModal: () => void;
  onCloseVideo: () => void;
  onConfirmSet: (data: SetConfirmData) => void;
  onFinishSession: (confirmOverload: boolean) => void;
  onOpenVideo: () => void;
  painOpen: boolean;
  plan: LiveSessionPlan;
  ruleModalOpen: boolean;
  secondsElapsed: number;
  spec: MotionSpec | null;
  videoOpen: boolean;
}

export function LiveWorkoutModals({
  aiCountedReps,
  confirmSetOpen,
  currentSet,
  endOpen,
  exercise,
  guideOpen,
  includeActiveModals = true,
  loggedSets,
  onAbortSession,
  onCloseConfirmSet,
  onCloseEnd,
  onCloseGuide,
  onClosePain,
  onCloseRuleModal,
  onCloseVideo,
  onConfirmSet,
  onFinishSession,
  onOpenVideo,
  painOpen,
  plan,
  ruleModalOpen,
  secondsElapsed,
  spec,
  videoOpen,
}: LiveWorkoutModalsProps) {
  const volumeKg = sessionVolumeKg(loggedSets);
  const isOverload = isAnomalousLoad(volumeKg, plan.recentAvgVolumeKg);
  const endVariant: EndDialogVariant =
    loggedSets.length === 0 ? "empty" : isOverload ? "overload" : "complete";

  return (
    <>
      {confirmSetOpen ? (
        <SetConfirmDialog
          aiCountedReps={aiCountedReps}
          currentSet={currentSet}
          exercise={exercise}
          onClose={onCloseConfirmSet}
          onConfirm={onConfirmSet}
          secondsElapsed={secondsElapsed}
          totalSets={Math.max(1, exercise.targetSets)}
        />
      ) : null}

      {includeActiveModals && guideOpen ? (
        <InstructionsSheet
          exercise={exercise}
          onClose={onCloseGuide}
          onWatchVideo={exercise.videoUrl ? onOpenVideo : undefined}
        />
      ) : null}

      {includeActiveModals && videoOpen && exercise.videoUrl ? (
        <DemoVideoOverlay
          name={exercise.name}
          onClose={onCloseVideo}
          posterUrl={exercise.thumbnailUrl}
          videoUrl={exercise.videoUrl}
        />
      ) : null}

      {includeActiveModals ? (
        <RuleVoiceModal isOpen={ruleModalOpen} onClose={onCloseRuleModal} spec={spec} />
      ) : null}

      {painOpen ? (
        <PainReportDialog
          onDismiss={onClosePain}
          onStop={(note) => {
            onClosePain();
            onAbortSession("pain", note);
          }}
        />
      ) : null}

      {endOpen ? (
        <EndSessionDialog
          loadRatio={loadRatio(volumeKg, plan.recentAvgVolumeKg)}
          onAbort={(reason) => {
            onCloseEnd();
            onAbortSession(reason);
          }}
          onClose={onCloseEnd}
          onFinish={(confirmOverload) => {
            onCloseEnd();
            onFinishSession(confirmOverload);
          }}
          totalSets={loggedSets.length}
          variant={endVariant}
        />
      ) : null}
    </>
  );
}
