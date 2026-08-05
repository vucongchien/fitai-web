"use client";

import { Camera, Check, HeartPulse } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formScore as computeFormScore } from "@/features/workout/domain/pose-metrics";
import { exercisesOfPhase, PHASE_LABEL } from "@/features/workout/domain/session-flow";
import { countUnverifiedSets, needsEmptySessionPrompt } from "@/features/workout/domain/session-guards";
import {
  averageFormScore,
  averageRpe,
  estimateCalories,
  findNewPersonalRecords,
  isAnomalousLoad,
  loadRatio,
  sessionVolumeKg,
} from "@/features/workout/domain/training-load";
import type {
  AbortReason,
  LiveSessionPlan,
  SessionReport,
  SetLogDraft,
} from "@/features/workout/model/live-session.types";
import { useAudioCoach } from "@/features/workout/model/use-audio-coach";
import { useCameraStream } from "@/features/workout/model/use-camera-stream";
import { type SetReview, useLiveSession } from "@/features/workout/model/use-live-session";
import { useMotionEngine } from "@/features/workout/model/use-motion-engine";
import { abortWorkoutSession, completeWorkoutSession } from "@/features/workout/server/workout-actions";
import { CalibrationView } from "@/features/workout/ui/live/calibration-view";
import { CameraStage } from "@/features/workout/ui/live/camera-stage";
import { type EndDialogVariant, EndSessionDialog } from "@/features/workout/ui/live/end-session-dialog";
import { GuideToggles } from "@/features/workout/ui/live/guide-toggles";
import { InstructionsSheet } from "@/features/workout/ui/live/instructions-sheet";
import { MusicMiniControl } from "@/features/workout/ui/live/music-mini-control";
import { MusicSheet } from "@/features/workout/ui/live/music-sheet";
import { PhaseIntro } from "@/features/workout/ui/live/phase-intro";
import { RestView } from "@/features/workout/ui/live/rest-view";
import { SessionShell } from "@/features/workout/ui/live/session-shell";
import { SetReviewSheet } from "@/features/workout/ui/live/set-review-sheet";
import { SetTimer } from "@/features/workout/ui/live/set-timer";
import { VideoGuideOverlay } from "@/features/workout/ui/live/video-guide-overlay";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toast";
import { TripleLane } from "@/shared/ui/triple-lane";

/** The summary route reads this back — the mock stand-in for the report endpoint. */
export function reportStorageKey(sessionId: string): string {
  return `fitai-live-report:${sessionId}`;
}

type SheetName = "music" | "instructions" | null;

export function LiveWorkout({ plan }: { plan: LiveSessionPlan }) {
  const router = useRouter();
  const session = useLiveSession(plan);
  const audio = useAudioCoach(plan.playlists);
  const camera = useCameraStream();

  const [watching, setWatching] = useState(false);
  const [listening, setListening] = useState(false);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [endVariant, setEndVariant] = useState<EndDialogVariant | null>(null);
  const [online, setOnline] = useState(true);
  /** Set-level opt-out of the camera: permission denied, low light, or user choice. */
  const [manualForSet, setManualForSet] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const step = session.step;
  const exercise = step?.exercise ?? null;
  const spec = useMemo(
    () =>
      exercise?.hasAiSupported ? (plan.motionSpecs[exercise.exerciseId] ?? null) : null,
    [exercise, plan.motionSpecs],
  );
  const cameraBranch = Boolean(spec) && !manualForSet;

  // --- coaching cues ------------------------------------------------------
  const playCueByCode = useCallback(
    (code: string) => {
      if (!listening || !spec) return;
      const cue = spec.cues.find((entry) => entry.code === code);
      if (cue) audio.playCue(cue, spec.cueCooldownSec[code] ?? 0);
    },
    [audio, listening, spec],
  );

  const motion = useMotionEngine({
    onFallback: (reason) => {
      // ux-flow-spec §5.3: a soft toast, never a red error.
      setManualForSet(true);
      toast.info(
        reason === "low-light"
          ? "Not enough light to track — switching to manual logging."
          : "Camera tracking stopped — switching to manual logging.",
      );
    },
    onFormError: (error) => playCueByCode(error.code),
  });

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Pre-select a playlist without autoplay; the first user gesture starts it.
  const playlistPrimed = useRef(false);
  useEffect(() => {
    if (playlistPrimed.current || audio.playlistId || plan.playlists.length === 0) return;
    playlistPrimed.current = true;
    audio.selectPlaylist(plan.playlists[0]!.id, { autoplay: false });
  }, [audio, plan.playlists]);

  // A new exercise gets a fresh camera decision.
  const exerciseId = exercise?.exerciseId ?? null;
  useEffect(() => {
    setManualForSet(false);
    setVideoExpanded(false);
  }, [exerciseId]);

  // --- camera lifecycle ---------------------------------------------------
  useEffect(() => {
    if (!cameraBranch || !spec || session.status === "complete") return;
    let cancelled = false;

    void (async () => {
      const started = await camera.start();
      if (cancelled) return;
      if (!started) {
        setManualForSet(true);
        toast.info("Camera is unavailable — this set is logged by hand.");
        return;
      }
      const kind = await motion.prepare(spec, camera.videoRef.current);
      if (cancelled) return;
      if (kind === "manual") {
        setManualForSet(true);
        return;
      }
      if (kind === "simulated") {
        toast.info("Running the camera in demo mode — the pose model is not installed yet.");
      }
      motion.startCalibration();
    })();

    return () => {
      cancelled = true;
      motion.stopCalibration();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraBranch, exerciseId, spec]);

  // Release the camera as soon as this exercise no longer needs it.
  useEffect(() => {
    if (!cameraBranch) camera.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraBranch]);

  // --- set lifecycle ------------------------------------------------------
  const startSet = useCallback(() => {
    if (!exercise) return;
    session.actions.startSet(exercise.durationSeconds);
    if (!audio.isPlaying) audio.play();
    playCueByCode("set-start");
    if (cameraBranch) {
      motion.stopCalibration();
      motion.startSet();
    }
  }, [audio, cameraBranch, exercise, motion, playCueByCode, session.actions]);

  const finishSet = useCallback(() => {
    if (!exercise) return;
    playCueByCode("set-end");

    if (cameraBranch) {
      const telemetry = motion.stopSet();
      const review: SetReview = {
        cameraAngle: spec?.recommendedCameraAngle ?? "",
        formScore:
          telemetry.countedReps > 0
            ? computeFormScore({
                averageRom: telemetry.averageRom,
                errorCount: telemetry.errorCount,
                repCount: telemetry.countedReps,
                secondsPerRep: telemetry.secondsPerRep,
              })
            : null,
        repLogs: telemetry.reps,
        reps: telemetry.countedReps,
        source: "camera",
        validFrameRatio: telemetry.validFrameRatio,
        weightKg: exercise.targetWeightKg,
      };
      session.actions.finishSet(review);
      return;
    }

    // Manual branch — BR-WL-03 keeps Form Score empty rather than inventing one.
    session.actions.finishSet({
      cameraAngle: "",
      formScore: null,
      repLogs: [],
      reps: exercise.targetReps,
      source: "manual",
      validFrameRatio: null,
      weightKg: exercise.targetWeightKg,
    });
  }, [cameraBranch, exercise, motion, playCueByCode, session.actions, spec]);

  // A hold ends by itself when the clock runs out.
  useEffect(() => {
    if (session.status !== "working" || !exercise) return;
    if (exercise.durationSeconds > 0 && session.setLeft === 0) finishSet();
  }, [exercise, finishSet, session.setLeft, session.status]);

  // Tracked sets close once the prescribed reps are in.
  useEffect(() => {
    if (session.status !== "working" || !cameraBranch || !exercise) return;
    if (exercise.targetReps > 0 && motion.repCount >= exercise.targetReps) finishSet();
  }, [cameraBranch, exercise, finishSet, motion.repCount, session.status]);

  const saveSet = useCallback(
    (set: Omit<SetLogDraft, "loggedAt" | "synced">) => {
      session.actions.saveSet(set);
      toast.success("Set saved.");
    },
    [session.actions],
  );

  // --- ending the session -------------------------------------------------
  const buildReport = useCallback(
    (sets: SetLogDraft[]): SessionReport => {
      const nameById = new Map(
        [...plan.warmUps, ...plan.mainExercises, ...plan.coolDowns].map((item) => [
          item.exerciseId,
          item.name,
        ]),
      );
      const volume = sessionVolumeKg(sets);
      const durationMin = Math.max(1, Math.round(session.elapsedSec / 60));
      return {
        averageFormScore: averageFormScore(sets),
        averageRpe: averageRpe(sets),
        durationMin,
        estimatedCalories: estimateCalories(durationMin, volume),
        hasUnverifiedSets: countUnverifiedSets(sets) > 0,
        personalRecords: findNewPersonalRecords(sets, plan.personalRecords).map((record) => ({
          exerciseId: record.exerciseId,
          name: nameById.get(record.exerciseId) ?? record.exerciseId,
          oneRepMaxKg: Math.round(record.oneRepMaxKg * 10) / 10,
        })),
        sessionId: plan.sessionId,
        totalSets: sets.length,
        totalVolumeKg: volume,
      };
    },
    [plan, session.elapsedSec],
  );

  const finishSession = useCallback(
    async (confirmOverload: boolean) => {
      const sets = session.loggedSets;
      if (needsEmptySessionPrompt(sets)) {
        setEndVariant("empty");
        return;
      }
      // BR-WL-02 — an unusually big session needs a yes before it is saved.
      if (!confirmOverload && isAnomalousLoad(sessionVolumeKg(sets), plan.recentAvgVolumeKg)) {
        setEndVariant("overload");
        return;
      }

      setFinishing(true);
      audio.stopAll();
      camera.stop();
      motion.dispose();

      const totals = await completeWorkoutSession(plan.sessionId, sets, confirmOverload).catch(
        () => null,
      );
      const report = buildReport(sets);
      try {
        sessionStorage.setItem(
          reportStorageKey(plan.sessionId),
          JSON.stringify({
            ...report,
            averageFormScore: totals?.averageFormScore ?? report.averageFormScore,
            averageRpe: totals?.averageRpe ?? report.averageRpe,
            totalVolumeKg: totals?.totalVolumeKg ?? report.totalVolumeKg,
          }),
        );
      } catch {
        // The summary falls back to its own copy if storage is unavailable.
      }
      session.actions.clearDraft();
      router.push(`/workouts/live/${plan.sessionId}/summary`, {
        transitionTypes: ["workout-complete"],
      });
    },
    [audio, buildReport, camera, motion, plan, router, session.actions, session.loggedSets],
  );

  const abortSession = useCallback(
    async (reason: AbortReason) => {
      setFinishing(true);
      audio.stopAll();
      camera.stop();
      motion.dispose();
      await abortWorkoutSession(plan.sessionId, reason).catch(() => null);
      session.actions.clearDraft();
      toast.info(
        reason === "pain"
          ? "Session stopped. Rest today — the next plan review will take this into account."
          : "Session stopped. Rest today, try again tomorrow.",
      );
      router.push("/home", { transitionTypes: ["nav-back"] });
    },
    [audio, camera, motion, plan.sessionId, router, session.actions],
  );

  // BR-WL-01 — 4 hours with no interaction closes the session by itself.
  const autoClosed = useRef(false);
  useEffect(() => {
    if (session.duration !== "auto-close" || autoClosed.current) return;
    autoClosed.current = true;
    void finishSession(true);
  }, [finishSession, session.duration]);

  // Reaching the end of the timeline finishes the session.
  useEffect(() => {
    if (session.status !== "complete" || finishing) return;
    void finishSession(false);
  }, [finishSession, finishing, session.status]);

  // --- render -------------------------------------------------------------
  if (!step || !exercise) {
    return (
      <main className="live-workout__empty">
        <TripleLane active="recover" compact morph />
        <h1>Wrapping up…</h1>
      </main>
    );
  }

  const phaseExercises = exercisesOfPhase(plan, step.phase);
  const totalSetsOfExercise = Math.max(1, exercise.targetSets);
  const laneState = session.status === "resting" ? "recover" : "move";

  return (
    <SessionShell
      durationWarning={session.duration === "long" || session.duration === "very-long"
        ? "This session has run long. Want to wrap it up?"
        : null}
      elapsedSec={session.elapsedSec}
      online={online}
      onEnd={() => setEndVariant("menu")}
      pendingSyncCount={session.pendingSyncCount}
      phaseLabel={PHASE_LABEL[step.phase]}
      progress={session.progress}
      protectionNote={plan.protectionNote}
      stepLabel={`Exercise ${step.exercisePosition} of ${phaseExercises.length} · set ${step.setNumber}/${totalSetsOfExercise}`}
    >
      {session.status === "phase-intro" ? (
        <PhaseIntro
          exercises={phaseExercises}
          onBegin={() => {
            session.actions.beginPhase();
            if (!audio.isPlaying) audio.play();
          }}
          onSkip={session.actions.skipPhase}
          phase={step.phase}
        />
      ) : (
        <>
          <section className="exercise-stage">
            <TripleLane active={laneState} compact morph />

            <div className="exercise-stage__heading">
              <p className="utility-label">
                Set {step.setNumber} of {totalSetsOfExercise}
                {spec ? (
                  <span className="ai-chip">
                    <Camera aria-hidden="true" size={12} />
                    {cameraBranch ? "AI form" : "Manual"}
                  </span>
                ) : null}
              </p>
              <h1>{exercise.name}</h1>
              <p>{exercise.notes || exercise.instructions}</p>
            </div>

            <div className="exercise-stage__tools">
              <GuideToggles
                listening={listening}
                onOpenInstructions={() => setSheet("instructions")}
                onToggleListening={() => setListening((value) => !value)}
                onToggleWatching={() => setWatching((value) => !value)}
                watching={watching}
              />
              <MusicMiniControl audio={audio} onOpenSheet={() => setSheet("music")} />
            </div>

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
            ) : cameraBranch ? (
              <CameraStage
                alert={Boolean(motion.lastError)}
                onFlip={camera.flip}
                pose={motion.pose}
                state={camera.state}
                videoRef={camera.videoRef}
              >
                {session.status === "working" ? (
                  <div className="camera-hud">
                    <div className="camera-hud__count" aria-live="polite">
                      <strong className="data-value">{motion.repCount}</strong>
                      <span>/ {exercise.targetReps || "—"} reps</span>
                    </div>
                    {motion.lastError ? (
                      <p className="camera-hud__alert" aria-live="assertive">
                        {motion.lastError}
                      </p>
                    ) : null}
                    <Button onClick={finishSet} size="large">
                      <Check aria-hidden="true" size={18} />
                      Set done
                    </Button>
                  </div>
                ) : (
                  <CalibrationView
                    calibration={motion.calibration}
                    cameraState={camera.state}
                    onRetryPermission={() => void camera.start()}
                    onStart={startSet}
                    onUseManual={() => setManualForSet(true)}
                    recommendedAngle={spec?.recommendedCameraAngle ?? "front"}
                  />
                )}
              </CameraStage>
            ) : (
              <SetTimer
                exercise={exercise}
                onFinish={finishSet}
                onStart={startSet}
                running={session.status === "working"}
                secondsLeft={session.setLeft}
              />
            )}
          </section>

          <footer className="workout-actions">
            {session.status === "ready" && step.setNumber === 1 && step.phase !== "main" ? (
              <button className="text-action" onClick={session.actions.skipExercise} type="button">
                Skip this movement
              </button>
            ) : null}
            <button className="injury-link" onClick={() => setEndVariant("reason")} type="button">
              <HeartPulse aria-hidden="true" size={16} />
              Report pain or stop early
            </button>
          </footer>
        </>
      )}

      {watching ? (
        <VideoGuideOverlay
          exercise={exercise}
          expanded={videoExpanded}
          onClose={() => setWatching(false)}
          onToggleExpanded={() => setVideoExpanded((value) => !value)}
        />
      ) : null}

      {session.status === "reviewing" && session.review ? (
        <SetReviewSheet
          exercise={exercise}
          onCancel={session.actions.cancelReview}
          onSave={saveSet}
          review={session.review}
          setNumber={step.setNumber}
          targetSets={totalSetsOfExercise}
        />
      ) : null}

      {sheet === "instructions" ? (
        <InstructionsSheet exercise={exercise} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "music" ? <MusicSheet audio={audio} onClose={() => setSheet(null)} /> : null}

      {endVariant ? (
        <EndSessionDialog
          loadRatio={loadRatio(sessionVolumeKg(session.loggedSets), plan.recentAvgVolumeKg)}
          onAbort={(reason) => void abortSession(reason)}
          onClose={() => setEndVariant(null)}
          onFinish={(confirmOverload) => {
            setEndVariant(null);
            void finishSession(confirmOverload);
          }}
          variant={endVariant}
        />
      ) : null}
    </SessionShell>
  );
}
