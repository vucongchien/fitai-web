"use client";

import { AlertCircle, CheckCircle2, Flag, HelpCircle, ShieldAlert, Swords } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  formatChallengeScore,
  formatSecondsClock,
  resolveParticipants,
} from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { useSoloDuel } from "@/features/solo-match/model/use-solo-duel";
import { DuelComboOverlay } from "@/features/solo-match/ui/duel-combo-overlay";
import { DuelParticleCanvas } from "@/features/solo-match/ui/duel-particle-canvas";
import { DuelRepGauge } from "@/features/solo-match/ui/duel-rep-gauge";
import { DuelVersusHud } from "@/features/solo-match/ui/duel-versus-hud";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { CountdownRing } from "@/features/workout/ui/live/countdown-ring";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { PoseStencilOverlay } from "@/features/workout/ui/live/pose-stencil-overlay";
import { SessionHeader } from "@/features/workout/ui/live/session-header";
import type { HeaderAction } from "@/features/workout/ui/live/session-header";
import { NAV_BACK, NAV_FORWARD } from "@/shared/ui/transition-types";

export interface DuelArenaViewProps {
  currentUserId: string;
  match: SoloMatchSummary | null;
  onnxSkeletonUrl: string;
  planId?: string;
  recommendedCameraAngle: string;
}

export function DuelArenaView({
  currentUserId,
  match,
  onnxSkeletonUrl,
  planId,
  recommendedCameraAngle,
}: DuelArenaViewProps) {
  const router = useRouter();
  const [confirmAction, setConfirmAction] = useState<"submit" | "forfeit" | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleMatchEnded = useCallback(
    (endedMatchId: string) => {
      router.push(`/challenge/${endedMatchId}/result`);
    },
    [router],
  );

  const { camera, forfeitMatch, liveState, pose, submitScore } = useSoloDuel({
    match,
    onMatchEnded: handleMatchEnded,
    onnxSkeletonUrl,
    planId,
    recommendedCameraAngle,
  });

  const headerActions: HeaderAction[] = useMemo(
    () => [
      {
        icon: <HelpCircle aria-hidden="true" size={19} />,
        key: "guide",
        label: "Exercise Guide",
        onClick: () => setGuideOpen(true),
      },
    ],
    [],
  );

  if (!match) {
    return (
      <div className="min-h-screen bg-white px-5 pt-6 pb-12 sm:px-7">
        <div className="mx-auto max-w-[640px] rounded-[20px] border border-neutral-200 bg-white p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)]">
            <AlertCircle aria-hidden="true" size={24} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[var(--color-text)]">
            Arena Session Not Found
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            This solo challenge could not be loaded or is no longer active.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[var(--color-action)] px-6 text-sm font-bold text-white transition-colors hover:opacity-90"
              href="/challenge"
              transitionTypes={NAV_BACK}
            >
              <Swords aria-hidden="true" size={17} />
              Return to Solo Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { me, opponent } = resolveParticipants(match, currentUserId);
  const myDisplayName = me?.displayName || "You";
  const opponentDisplayName = opponent?.displayName || "Challenger";
  const isSpectating = liveState.myStatus === "SPECTATING" || liveState.myStatus === "COMPLETED";

  const totalCeiling =
    match.ceilingSeconds && match.ceilingSeconds > 0 ? match.ceilingSeconds : 300;
  const ceilingProgress = Math.max(
    0,
    Math.min(1, liveState.remainingCeilingSeconds / totalCeiling),
  );

  return (
    <div
      className="live-screen live-screen--duel"
      data-camera-active={!isSpectating}
      data-spectating={isSpectating}
    >
      {/* Universal Session Header with Form Guide action button */}
      <SessionHeader
        actions={headerActions}
        onBack={() => setConfirmAction("forfeit")}
        title={match.exerciseName}
      />

      {/* Row 2: Top Arena Scoreboard Strip (OUTSIDE and ABOVE Camera Stage) */}
      {!isSpectating ? (
        <div className="w-full pt-1 pb-1">
          <DuelVersusHud
            challengeType={match.challengeType}
            connectionPhase={liveState.connectionPhase}
            currentAngle={liveState.currentAngle}
            myDisplayName={myDisplayName}
            myStatus={liveState.myStatus}
            myValue={liveState.myValue}
            opponentDisplayName={opponentDisplayName}
            opponentStatus={liveState.opponentStatus}
            opponentValue={liveState.opponentValue}
          />
        </div>
      ) : null}

      {/* Row 3: Central Media Stage (Spectating Mode OR Clean Camera Feed with Stencil) */}
      {isSpectating ? (
        <section
          aria-live="polite"
          className="live-screen__media relative flex flex-col items-center justify-center rounded-[var(--radius-hero)] border border-neutral-200/90 bg-white p-6 sm:p-8 text-center shadow-xs"
          data-testid="spectating-stage"
        >
          {/* Subtle Live Radar Indicator */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-action-soft)] px-3.5 py-1 text-xs font-bold text-[var(--color-action)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-action)] animate-pulse" />
            <span>Live Duel In Progress</span>
          </div>

          <h2 className="mt-3.5 text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--color-text)]">
            Your Score Is Locked In ({formatChallengeScore(liveState.myValue, match.challengeType)})
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-muted)] max-w-sm leading-relaxed">
            Camera paused. Spectating{" "}
            <strong className="text-[var(--color-text)] font-semibold">
              {opponentDisplayName}
            </strong>{" "}
            until their set concludes.
          </p>

          {/* Symmetrical Two-Player Duel Tracker (Single-line names, NO '(YOU)' tag) */}
          <div className="mt-6 w-full max-w-md rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 sm:gap-4 items-center">
              {/* You */}
              <div className="flex flex-col items-start pr-1 min-w-0">
                <span className="text-[11px] font-extrabold tracking-wider text-[var(--color-action)] uppercase truncate max-w-[130px] sm:max-w-[180px]">
                  {myDisplayName}
                </span>
                <div className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)] tabular-nums [font-family:var(--font-display)]">
                  {formatChallengeScore(liveState.myValue, match.challengeType)}
                </div>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                  <CheckCircle2 size={11} className="text-emerald-500" />
                  Locked
                </span>
              </div>

              {/* Center: Subtle VS Pill */}
              <div className="flex items-center justify-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 text-[10px] font-extrabold text-neutral-400">
                  VS
                </span>
              </div>

              {/* Rival */}
              <div className="flex flex-col items-end pl-1 min-w-0">
                <span className="text-[11px] font-extrabold tracking-wider text-neutral-500 uppercase truncate max-w-[130px] sm:max-w-[180px]">
                  {opponentDisplayName}
                </span>
                <div className="mt-1.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-text)] tabular-nums [font-family:var(--font-display)]">
                  {formatChallengeScore(liveState.opponentValue, match.challengeType)}
                </div>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-[var(--color-action)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-action)] animate-pulse" />
                  {liveState.opponentStatus === "COMPLETED" ? "Submitted" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="live-screen__media relative w-full h-full rounded-[var(--radius-hero)] overflow-hidden bg-black shadow-lg">
          <CameraStage
            activeErrors={liveState.detectedErrors}
            alert={liveState.detectedErrors.length > 0}
            mirrored={camera.facingMode === "user"}
            onFlip={camera.flip}
            pose={pose}
            state={camera.state}
            videoRef={camera.videoRef}
          >
            {/* Stance Silhouette Guidance: Helps user step into frame and align posture before/during set */}
            {!isAligned ? (
              <PoseStencilOverlay
                exerciseId={match.exerciseId || "push_up"}
                onAlignedLock={() => setIsAligned(true)}
                onSkip={() => setIsAligned(true)}
                pose={pose}
                recommendedAngle={recommendedCameraAngle}
              />
            ) : null}

            {/* Live Rep / Form Progress Gauge */}
            <DuelRepGauge
              challengeType={match.challengeType}
              currentAngle={liveState.currentAngle}
              exerciseId={match.exerciseId || "push_up"}
              lastRepConfirmedAtMs={liveState.lastRepConfirmedAtMs}
              myFormScore={liveState.myFormScore}
            />

            {/* Combo Streak & Milestone Celebrations */}
            <DuelComboOverlay
              comboStreak={liveState.comboStreak}
              lastMilestone={liveState.lastMilestone}
              lastRepConfirmedAtMs={liveState.lastRepConfirmedAtMs}
            />

            {/* Hybrid 2D Canvas Particle Burst */}
            <DuelParticleCanvas
              lastMilestone={liveState.lastMilestone}
              lastRepConfirmedAtMs={liveState.lastRepConfirmedAtMs}
              myValue={liveState.myValue}
              opponentValue={liveState.opponentValue}
            />
          </CameraStage>
        </div>
      )}

      {/* Row 4: Universal Footer (Forfeit / Ticking Countdown Ring / Submit Button) */}
      <footer className="live-screen__footer">
        {isSpectating ? (
          <div className="col-span-3 flex justify-center py-2">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-action)] px-8 text-sm font-bold text-white shadow-xs transition-transform hover:opacity-95 active:scale-[0.99]"
              href={`/challenge/${match.matchId}/result`}
              transitionTypes={NAV_FORWARD}
            >
              View Match Report
            </Link>
          </div>
        ) : (
          <>
            {/* Left: Forfeit secondary action with pepper-grey border */}
            <button
              aria-label="Forfeit match"
              className="flex h-12 min-w-0 sm:min-w-[4.5rem] items-center justify-center gap-1 sm:gap-1.5 rounded-xl border border-neutral-300 bg-white/95 px-3 sm:px-4 text-xs font-bold text-neutral-600 shadow-xs transition-all hover:bg-neutral-50 hover:text-neutral-900 active:scale-95 cursor-pointer justify-self-start whitespace-nowrap"
              data-testid="open-forfeit-modal-button"
              onClick={() => setConfirmAction("forfeit")}
              type="button"
            >
              <Flag aria-hidden="true" size={15} />
              <span>Forfeit</span>
            </button>

            {/* Center: CountdownRing for Ceiling Timer (Ticking second-by-second) */}
            <div data-testid="duel-ceiling-timer">
              <CountdownRing
                display={formatSecondsClock(liveState.remainingCeilingSeconds)}
                label="Match ceiling countdown"
                progress={ceilingProgress}
                tone="action"
              />
            </div>

            {/* Right: Submit Score primary action (Vibrant Relay Blue) */}
            <button
              aria-label="Submit Score"
              className="flex h-12 min-w-0 sm:min-w-[5rem] items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-[var(--color-action)] hover:bg-[var(--color-action-hover)] px-3 sm:px-5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer justify-self-end whitespace-nowrap"
              data-testid="open-submit-modal-button"
              onClick={() => setConfirmAction("submit")}
              type="button"
            >
              <CheckCircle2 aria-hidden="true" size={17} />
              <span>Submit</span>
            </button>
          </>
        )}
      </footer>

      {/* Slide-over Exercise Form Instructions Sheet */}
      {guideOpen ? (
        <InstructionsSheet
          exercise={{
            commonMistakes: [
              "Rushing repetitions without locking out",
              "Cutting range of motion short",
            ],
            durationSeconds: match.ceilingSeconds || 300,
            equipmentId: "bodyweight",
            exerciseId: match.exerciseId,
            formCues: ["Maintain strict cadence", "Full range of motion on every repetition"],
            hasAiSupported: true,
            instructions: `1. Stand clearly in frame with your full body visible.\n2. Perform ${match.exerciseName} with proper form and steady cadence.\n3. The AI referee evaluates joint angles and counts valid repetitions automatically.`,
            isWeighted: false,
            name: match.exerciseName,
            notes:
              "Solo ranked challenge mode. Form score and repetition count are monitored at 20 FPS.",
            phase: "main",
            restExerciseSec: 0,
            restSetSec: 0,
            targetReps: 0,
            targetRpe: 9,
            targetSets: 1,
            targetWeightKg: 0,
          }}
          onClose={() => setGuideOpen(false)}
        />
      ) : null}

      {/* Confirmation Modal for Submit Score or Forfeit */}
      {confirmAction ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="dialog"
        >
          <div className="w-full max-w-[400px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-soft)] text-[var(--color-action)]">
                {confirmAction === "submit" ? (
                  <CheckCircle2 aria-hidden="true" size={22} />
                ) : (
                  <ShieldAlert aria-hidden="true" size={22} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {confirmAction === "submit" ? "Lock In Your Score?" : "Forfeit This Duel?"}
                </h2>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  {confirmAction === "submit"
                    ? `Current Verified Score: ${formatChallengeScore(liveState.myValue, match.challengeType)}`
                    : "This action ends your run immediately."}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {confirmAction === "submit"
                ? "Once submitted, your score is locked in. You will switch to Spectating Mode to watch your opponent finish."
                : "Forfeiting records an immediate loss for this duel and awards Victory to your rival."}
            </p>

            <div className="mt-6 flex gap-2.5">
              <button
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 text-xs font-bold text-[var(--color-text)] transition-colors hover:bg-neutral-50 active:scale-[0.99]"
                onClick={() => setConfirmAction(null)}
                type="button"
              >
                Keep Competing
              </button>

              <button
                className={`flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-xs font-bold text-white transition-colors active:scale-[0.99] ${
                  confirmAction === "submit"
                    ? "bg-[var(--color-action)] hover:bg-[var(--color-action-hover)]"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                data-testid="confirm-modal-action-button"
                onClick={async () => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  if (action === "submit") {
                    await submitScore();
                  } else {
                    await forfeitMatch();
                  }
                }}
                type="button"
              >
                {confirmAction === "submit" ? "Confirm & Spectate" : "Confirm Forfeit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Match Settlement Verdict Splash (Displayed while backend outbox and scores settle) */}
      {liveState.isSettling ? (
        <div
          aria-live="assertive"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          data-testid="settlement-splash"
          role="status"
        >
          <div className="w-full max-w-[420px] rounded-3xl border border-neutral-200/20 bg-neutral-900/95 p-7 text-center shadow-2xl text-white">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-action)] text-white shadow-lg shadow-indigo-500/30">
              <Swords aria-hidden="true" size={32} />
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Match Complete!</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-neutral-300">
              Calculating official verdict and locking rankings...
            </p>

            {/* Symmetrical Duel Score Preview */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                {/* User */}
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-action)] truncate max-w-[120px]">
                    {myDisplayName}
                  </span>
                  <div className="mt-1 text-3xl font-extrabold text-white tabular-nums [font-family:var(--font-display)]">
                    {formatChallengeScore(liveState.myValue, match.challengeType)}
                  </div>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    Locked
                  </span>
                </div>

                {/* Center VS */}
                <div className="flex items-center justify-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-extrabold text-neutral-400">
                    VS
                  </span>
                </div>

                {/* Rival */}
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 truncate max-w-[120px]">
                    {opponentDisplayName}
                  </span>
                  <div className="mt-1 text-3xl font-extrabold text-white tabular-nums [font-family:var(--font-display)]">
                    {formatChallengeScore(liveState.opponentValue, match.challengeType)}
                  </div>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    Locked
                  </span>
                </div>
              </div>
            </div>

            {/* Spinner indicator */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-[var(--color-action)] animate-ping" />
              <span>Finalizing match report...</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
