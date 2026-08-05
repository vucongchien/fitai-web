"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  buildTimeline,
  progressRatio,
  restSecondsAfter,
  type SessionStep,
  stepIndexAfterExercise,
  stepIndexAfterPhase,
} from "@/features/workout/domain/session-flow";
import { type DurationState, durationState } from "@/features/workout/domain/session-guards";
import type {
  LiveSessionPlan,
  SessionPhase,
  SetLogDraft,
  SetSource,
} from "@/features/workout/model/live-session.types";
import { elapsedSeconds, secondsLeft, useTicker } from "@/features/workout/model/use-session-timer";
import { syncWorkoutLogs } from "@/features/workout/server/workout-actions";

/**
 * The live session state machine.
 *
 *   phase-intro → ready → working → reviewing → (resting) → ready → … → complete
 *
 * `phase-intro` is what makes ux-flow-spec §5.1 real: warm-up, main work and
 * cooldown are three separate blocks in one linear flow, each skippable.
 * `reviewing` is the confirmation step §5.3 asks for — a set is never saved
 * without the user's say-so, camera branch included.
 */
export type LiveStatus = "phase-intro" | "ready" | "working" | "reviewing" | "resting" | "complete";

/** Auto-filled numbers handed to the review sheet. */
export type SetReview = {
  source: SetSource;
  reps: number;
  weightKg: number;
  formScore: number | null;
  repLogs: SetLogDraft["reps"];
  validFrameRatio: number | null;
  cameraAngle: string;
};

type State = {
  status: LiveStatus;
  /** Index into the timeline. While resting it already points at the next step. */
  stepIndex: number;
  startedAt: number;
  setEndsAt: number | null;
  restEndsAt: number | null;
  loggedSets: SetLogDraft[];
  skippedPhases: SessionPhase[];
  /** Phases whose intro card has been dismissed, so it shows once. */
  introSeen: SessionPhase[];
  review: SetReview | null;
};

type Action =
  | { type: "restore"; state: Partial<State> }
  | { type: "begin-phase" }
  | { type: "skip-phase" }
  | { type: "skip-exercise" }
  | { type: "start-set"; durationSeconds: number }
  | { type: "finish-set"; review: SetReview }
  | { type: "cancel-review" }
  | { type: "save-set"; set: SetLogDraft; restSeconds: number }
  | { type: "end-rest" }
  | { type: "add-rest"; seconds: number }
  | { type: "mark-synced"; setNumbers: Array<{ exerciseId: string; setNumber: number }> }
  | { type: "complete" };

type Context = { timeline: SessionStep[] };

function arriveAt(state: State, timeline: SessionStep[], index: number): State {
  const step = timeline[index];
  if (!step) {
    return {
      ...state,
      status: "complete",
      stepIndex: index,
      restEndsAt: null,
      setEndsAt: null,
      review: null,
    };
  }
  return {
    ...state,
    status: "ready",
    stepIndex: index,
    restEndsAt: null,
    setEndsAt: null,
    review: null,
  };
}

function reducer(state: State, action: Action, context: Context): State {
  const { timeline } = context;
  const step = timeline[state.stepIndex];

  switch (action.type) {
    case "restore":
      return { ...state, ...action.state };

    case "begin-phase": {
      if (!step) return state;
      const introSeen = state.introSeen.includes(step.phase)
        ? state.introSeen
        : [...state.introSeen, step.phase];
      return { ...state, introSeen, status: "ready" };
    }

    case "skip-phase": {
      if (!step) return state;
      const skippedPhases = state.skippedPhases.includes(step.phase)
        ? state.skippedPhases
        : [...state.skippedPhases, step.phase];
      const introSeen = state.introSeen.includes(step.phase)
        ? state.introSeen
        : [...state.introSeen, step.phase];
      return arriveAt(
        { ...state, skippedPhases, introSeen },
        timeline,
        stepIndexAfterPhase(timeline, step.phase),
      );
    }

    case "skip-exercise":
      return arriveAt(state, timeline, stepIndexAfterExercise(timeline, state.stepIndex));

    case "start-set":
      return {
        ...state,
        status: "working",
        setEndsAt: action.durationSeconds > 0 ? Date.now() + action.durationSeconds * 1000 : null,
      };

    case "finish-set":
      return { ...state, status: "reviewing", setEndsAt: null, review: action.review };

    case "cancel-review":
      return { ...state, status: "ready", review: null };

    case "save-set": {
      const loggedSets = [...state.loggedSets, action.set];
      const nextIndex = state.stepIndex + 1;
      const withSet = { ...state, loggedSets, review: null };
      if (nextIndex < timeline.length && action.restSeconds > 0) {
        return {
          ...withSet,
          status: "resting",
          stepIndex: nextIndex,
          setEndsAt: null,
          restEndsAt: Date.now() + action.restSeconds * 1000,
        };
      }
      return arriveAt(withSet, timeline, nextIndex);
    }

    case "end-rest":
      return arriveAt(state, timeline, state.stepIndex);

    case "add-rest":
      return {
        ...state,
        restEndsAt: Math.max(state.restEndsAt ?? Date.now(), Date.now()) + action.seconds * 1000,
      };

    case "mark-synced": {
      const keys = new Set(action.setNumbers.map((item) => `${item.exerciseId}#${item.setNumber}`));
      return {
        ...state,
        loggedSets: state.loggedSets.map((set) =>
          keys.has(`${set.exerciseId}#${set.setNumber}`) ? { ...set, synced: true } : set,
        ),
      };
    }

    case "complete":
      return { ...state, status: "complete", restEndsAt: null, setEndsAt: null };

    default:
      return state;
  }
}

const DRAFT_VERSION = "v2";

function draftKey(sessionId: string): string {
  return `fitai-live-session-${DRAFT_VERSION}:${sessionId}`;
}

type PersistedDraft = Pick<
  State,
  "stepIndex" | "startedAt" | "loggedSets" | "skippedPhases" | "introSeen"
>;

function readDraft(sessionId: string): PersistedDraft | null {
  try {
    const raw = sessionStorage.getItem(draftKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (!Array.isArray(parsed.loggedSets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useLiveSession(plan: LiveSessionPlan) {
  const timeline = useMemo(() => buildTimeline(plan), [plan]);

  const [state, dispatch] = useReducer(
    (current: State, action: Action) => reducer(current, action, { timeline }),
    undefined,
    (): State => ({
      status: timeline.length === 0 ? "complete" : "ready",
      stepIndex: 0,
      startedAt: Date.now(),
      setEndsAt: null,
      restEndsAt: null,
      loggedSets: [],
      skippedPhases: [],
      introSeen: [],
      review: null,
    }),
  );

  // Restore an interrupted session.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const draft = readDraft(plan.sessionId);
    if (!draft || draft.stepIndex >= timeline.length) return;
    dispatch({
      type: "restore",
      state: {
        ...draft,
        status: "ready",
        setEndsAt: null,
        restEndsAt: null,
        review: null,
      },
    });
  }, [plan.sessionId, timeline]);

  useEffect(() => {
    const draft: PersistedDraft = {
      stepIndex: state.stepIndex,
      startedAt: state.startedAt,
      loggedSets: state.loggedSets,
      skippedPhases: state.skippedPhases,
      introSeen: state.introSeen,
    };
    try {
      sessionStorage.setItem(draftKey(plan.sessionId), JSON.stringify(draft));
    } catch {
      // A full or blocked storage must never break the workout.
    }
  }, [
    plan.sessionId,
    state.introSeen,
    state.loggedSets,
    state.skippedPhases,
    state.startedAt,
    state.stepIndex,
  ]);

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(draftKey(plan.sessionId));
    } catch {
      // ignore
    }
  }, [plan.sessionId]);

  // --- clocks -------------------------------------------------------------
  const needsTick =
    state.status === "working" || state.status === "resting" || state.status === "ready";
  const now = useTicker(needsTick || state.status === "reviewing");
  const restLeft = secondsLeft(state.restEndsAt, now);
  const setLeft = secondsLeft(state.setEndsAt, now);
  const elapsedSec = elapsedSeconds(state.startedAt, now);
  const elapsedMin = Math.floor(elapsedSec / 60);
  const duration: DurationState = durationState(elapsedMin);

  // Rest that runs out moves on by itself — the user should not have to tap to
  // leave a finished countdown.
  useEffect(() => {
    if (state.status === "resting" && state.restEndsAt !== null && restLeft === 0) {
      dispatch({ type: "end-rest" });
    }
  }, [restLeft, state.restEndsAt, state.status]);

  // --- offline queue ------------------------------------------------------
  // Sets are always kept locally first; the network is a best effort. This is
  // why logging is never blocked while offline.
  const syncing = useRef(false);
  const pending = useMemo(() => state.loggedSets.filter((set) => !set.synced), [state.loggedSets]);

  const flush = useCallback(async () => {
    if (syncing.current || pending.length === 0) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    syncing.current = true;
    try {
      await syncWorkoutLogs(plan.sessionId, pending);
      dispatch({
        type: "mark-synced",
        setNumbers: pending.map((set) => ({
          exerciseId: set.exerciseId,
          setNumber: set.setNumber,
        })),
      });
    } catch {
      // Stay unsynced and retry on the next set or the next `online` event.
    } finally {
      syncing.current = false;
    }
  }, [pending, plan.sessionId]);

  useEffect(() => {
    void flush();
  }, [flush]);

  useEffect(() => {
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  // --- actions ------------------------------------------------------------
  const step = timeline[state.stepIndex] ?? null;
  const nextStep = timeline[state.stepIndex + 1] ?? null;

  const beginPhase = useCallback(() => dispatch({ type: "begin-phase" }), []);
  const skipPhase = useCallback(() => dispatch({ type: "skip-phase" }), []);
  const skipExercise = useCallback(() => dispatch({ type: "skip-exercise" }), []);
  const startSet = useCallback(
    (durationSeconds: number) => dispatch({ type: "start-set", durationSeconds }),
    [],
  );
  const finishSet = useCallback(
    (review: SetReview) => dispatch({ type: "finish-set", review }),
    [],
  );
  const cancelReview = useCallback(() => dispatch({ type: "cancel-review" }), []);
  const endRest = useCallback(() => dispatch({ type: "end-rest" }), []);
  const addRest = useCallback((seconds: number) => dispatch({ type: "add-rest", seconds }), []);
  const completeSession = useCallback(() => dispatch({ type: "complete" }), []);

  const saveSet = useCallback(
    (set: Omit<SetLogDraft, "loggedAt" | "synced">) => {
      dispatch({
        type: "save-set",
        set: { ...set, loggedAt: Date.now(), synced: false },
        restSeconds: restSecondsAfter(timeline, state.stepIndex),
      });
    },
    [state.stepIndex, timeline],
  );

  return {
    timeline,
    step,
    nextStep,
    status: state.status,
    review: state.review,
    loggedSets: state.loggedSets,
    skippedPhases: state.skippedPhases,
    pendingSyncCount: pending.length,
    progress: progressRatio(state.loggedSets.length, timeline),
    restLeft,
    setLeft,
    elapsedSec,
    elapsedMin,
    duration,
    startedAt: state.startedAt,
    actions: {
      beginPhase,
      skipPhase,
      skipExercise,
      startSet,
      finishSet,
      cancelReview,
      saveSet,
      endRest,
      addRest,
      completeSession,
      clearDraft,
    },
  };
}

export type LiveSessionController = ReturnType<typeof useLiveSession>;
