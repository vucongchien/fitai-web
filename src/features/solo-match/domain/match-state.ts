import type { Timestamp } from "@bufbuild/protobuf/wkt";

import type {
  SoloChallengeType,
  SoloMatchLobbyPhase,
  SoloMatchmakingState,
  SoloMatchStatus,
  SoloMatchSummary,
  SoloParticipant,
  SoloParticipantResult,
} from "@/features/solo-match/model/solo-match.types";
import { computeAngleRomPercent } from "@/features/workout/domain/edge-referee";
import type { SoloMatchView } from "@/shared/api/gen/contracts/core/solo_match/v1/message/match_message_pb";

export const CHECKIN_WINDOW_SECONDS = 60;
export const BOT_FALLBACK_NOTICE_SECONDS = 240;
export const BOT_FALLBACK_MAX_SECONDS = 300;

export function timestampToIso(ts?: Timestamp): string | null {
  if (!ts) {
    return null;
  }
  const seconds = Number(ts.seconds ?? 0);
  const nanos = Number(ts.nanos ?? 0);
  if (seconds <= 0 && nanos <= 0) {
    return null;
  }
  const ms = seconds * 1000 + Math.floor(nanos / 1_000_000);
  return new Date(ms).toISOString();
}

export function normalizeChallengeType(raw: string): SoloChallengeType {
  return raw.toUpperCase() === "DURATION" ? "DURATION" : "REPS";
}

export function normalizeMatchStatus(raw: string): SoloMatchStatus {
  const upper = raw.toUpperCase();
  switch (upper) {
    case "PENDING_READY":
    case "IN_PROGRESS":
    case "COMPLETED":
    case "FORFEITED":
    case "CANCELLED": {
      return upper;
    }
    default: {
      return "PENDING_READY";
    }
  }
}

export function normalizeParticipantResult(raw: string): SoloParticipantResult {
  const upper = raw.toUpperCase();
  switch (upper) {
    case "WIN":
    case "LOSE":
    case "DRAW":
    case "FORFEITED": {
      return upper;
    }
    default: {
      return "PENDING";
    }
  }
}

export function mapProtoMatchToSummary(view: SoloMatchView): SoloMatchSummary {
  const participants: SoloParticipant[] = (view.participants ?? []).map((p) => ({
    avatarUrl: p.user?.avatarUrl ?? "",
    displayName: p.user?.displayName || "Challenger",
    isCompleted: Boolean(p.isCompleted),
    result: normalizeParticipantResult(p.result ?? "PENDING"),
    scoreValue: Number(p.scoreValue ?? 0),
    userId: p.user?.userId ?? "",
  }));

  return {
    challengeType: normalizeChallengeType(view.challengeType ?? "REPS"),
    endedAtIso: timestampToIso(view.endedAt),
    exerciseId: view.exerciseId ?? "",
    exerciseName: view.exerciseName || "Solo Challenge",
    isDraw: Boolean(view.isDraw),
    matchId: view.matchId ?? "",
    participants,
    readyDeadlineIso: timestampToIso(view.readyDeadline),
    startedAtIso: timestampToIso(view.startedAt),
    status: normalizeMatchStatus(view.status ?? "PENDING_READY"),
    timeoutAtIso: timestampToIso(view.timeoutAt),
    winnerId: view.winnerId ?? "",
  };
}

export function computeRemainingReadySeconds(
  readyDeadlineIso: string | null,
  nowMs = Date.now(),
  fallbackSeconds = CHECKIN_WINDOW_SECONDS,
): number {
  if (!readyDeadlineIso) {
    return fallbackSeconds;
  }
  const deadlineMs = Date.parse(readyDeadlineIso);
  if (Number.isNaN(deadlineMs)) {
    return fallbackSeconds;
  }
  const diffSeconds = Math.ceil((deadlineMs - nowMs) / 1000);
  return Math.max(0, Math.min(CHECKIN_WINDOW_SECONDS, diffSeconds));
}

export function computeRelativeLaneProgress(
  myValue: number,
  opponentValue: number,
): {
  leader: "me" | "opponent" | "tie";
  myPercent: number;
  opponentPercent: number;
} {
  const safeMy = Math.max(0, myValue);
  const safeOpp = Math.max(0, opponentValue);
  const maxVal = Math.max(safeMy, safeOpp);

  if (maxVal <= 0) {
    return {
      leader: "tie",
      myPercent: 0,
      opponentPercent: 0,
    };
  }

  const leader = safeMy > safeOpp ? "me" : safeOpp > safeMy ? "opponent" : "tie";
  return {
    leader,
    myPercent: Math.min(100, Math.round((safeMy / maxVal) * 100)),
    opponentPercent: Math.min(100, Math.round((safeOpp / maxVal) * 100)),
  };
}

export interface TugOfWarSplit {
  delta: number;
  leader: "me" | "opponent" | "tie";
  myShare: number;
  opponentShare: number;
}

const TUG_OF_WAR_MIN_SHARE = 12;
const TUG_OF_WAR_MAX_SHARE = 88;

export function computeTugOfWarSplit(myValue: number, opponentValue: number): TugOfWarSplit {
  const safeMy = Math.max(0, myValue);
  const safeOpp = Math.max(0, opponentValue);
  const delta = safeMy - safeOpp;
  const leader: TugOfWarSplit["leader"] = delta > 0 ? "me" : delta < 0 ? "opponent" : "tie";

  if (safeMy === safeOpp) {
    return {
      delta: 0,
      leader: "tie",
      myShare: 50,
      opponentShare: 50,
    };
  }

  const total = safeMy + safeOpp;
  const rawMyShare = total > 0 ? Math.round((safeMy / total) * 100) : 50;
  const myShare = Math.max(TUG_OF_WAR_MIN_SHARE, Math.min(TUG_OF_WAR_MAX_SHARE, rawMyShare));

  return {
    delta,
    leader,
    myShare,
    opponentShare: 100 - myShare,
  };
}

const SOLO_EXERCISE_ROM_TABLE: Record<string, { endDeg: number; startDeg: number }> = {
  bicep_curl: { endDeg: 45, startDeg: 160 },
  lunge: { endDeg: 90, startDeg: 170 },
  push_up: { endDeg: 90, startDeg: 170 },
  sit_up: { endDeg: 55, startDeg: 145 },
  squat: { endDeg: 90, startDeg: 170 },
};

const DEFAULT_SOLO_ROM = { endDeg: 90, startDeg: 170 };

export function resolveSoloExerciseRomBounds(exerciseId: string): {
  endDeg: number;
  startDeg: number;
} {
  const normalized = exerciseId.trim().toLowerCase().replace(/-/g, "_");
  for (const [key, bounds] of Object.entries(SOLO_EXERCISE_ROM_TABLE)) {
    if (normalized === key || normalized.includes(key)) {
      return bounds;
    }
  }
  return DEFAULT_SOLO_ROM;
}

export function computeSoloRepProgressPercent(params: {
  challengeType: SoloChallengeType;
  currentAngle: number;
  exerciseId: string;
  myFormScore: number;
}): number {
  if (params.challengeType === "DURATION") {
    return Math.max(0, Math.min(100, Math.round(params.myFormScore)));
  }

  const { startDeg, endDeg } = resolveSoloExerciseRomBounds(params.exerciseId);
  return computeAngleRomPercent(params.currentAngle, startDeg, endDeg);
}

export function resolveParticipants(
  match: SoloMatchSummary,
  currentUserId: string,
): {
  me: SoloParticipant | null;
  opponent: SoloParticipant | null;
} {
  const list = match.participants;
  if (list.length === 0) {
    return { me: null, opponent: null };
  }
  if (!currentUserId) {
    return {
      me: list[0] ?? null,
      opponent: list[1] ?? null,
    };
  }
  const me = list.find((p) => p.userId === currentUserId) ?? list[0] ?? null;
  const opponent = list.find((p) => p !== me) ?? null;
  return { me, opponent };
}

export function formatChallengeScore(value: number, challengeType: SoloChallengeType): string {
  const rounded = Math.max(0, Math.round(value));
  if (challengeType === "DURATION") {
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    return mins > 0 ? `${mins}m ${String(secs).padStart(2, "0")}s` : `${secs}s`;
  }
  return `${rounded} ${rounded === 1 ? "rep" : "reps"}`;
}

export function formatSecondsClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export type MatchmakingAction =
  | { type: "START_QUEUE" }
  | { elapsedSeconds: number; message?: string; type: "STREAM_QUEUED" }
  | { match: SoloMatchSummary; nowMs?: number; type: "STREAM_MATCHED" }
  | { message?: string; type: "STREAM_CANCELLED" }
  | { message?: string; type: "STREAM_TIMEOUT" }
  | { errorMessage: string; type: "STREAM_ERROR" }
  | { nowMs?: number; type: "READY_TICK" }
  | { activeMatch: SoloMatchSummary | null; nowMs?: number; type: "HYDRATE_ACTIVE_MATCH" }
  | { type: "RESET_TO_IDLE" };

export function createInitialMatchmakingState(
  activeMatch: SoloMatchSummary | null,
  nowMs = Date.now(),
): SoloMatchmakingState {
  if (
    activeMatch &&
    (activeMatch.status === "PENDING_READY" || activeMatch.status === "IN_PROGRESS")
  ) {
    if (activeMatch.status === "PENDING_READY") {
      const remaining = computeRemainingReadySeconds(activeMatch.readyDeadlineIso, nowMs);
      if (remaining <= 0) {
        return {
          activeMatch,
          elapsedSeconds: 0,
          errorMessage: "Check-in window expired before both players entered the arena.",
          phase: "expired",
          remainingReadySeconds: 0,
          statusMessage: "Match check-in expired",
        };
      }
      return {
        activeMatch,
        elapsedSeconds: 0,
        errorMessage: null,
        phase: "matched",
        remainingReadySeconds: remaining,
        statusMessage: "Match ready — enter the arena before the timer expires",
      };
    }

    return {
      activeMatch,
      elapsedSeconds: 0,
      errorMessage: null,
      phase: "matched",
      remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
      statusMessage: "Match in progress — resume your live duel",
    };
  }

  return {
    activeMatch: null,
    elapsedSeconds: 0,
    errorMessage: null,
    phase: "idle",
    remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
    statusMessage: "Ready to find an opponent",
  };
}

export function reduceMatchmakingState(
  state: SoloMatchmakingState,
  action: MatchmakingAction,
): SoloMatchmakingState {
  switch (action.type) {
    case "HYDRATE_ACTIVE_MATCH": {
      return createInitialMatchmakingState(action.activeMatch, action.nowMs ?? Date.now());
    }

    case "START_QUEUE": {
      // Prevent starting a new queue if an active match is already waiting or in progress
      if (
        state.phase === "matched" &&
        state.activeMatch &&
        (state.activeMatch.status === "PENDING_READY" || state.activeMatch.status === "IN_PROGRESS")
      ) {
        return state;
      }
      return {
        activeMatch: null,
        elapsedSeconds: 0,
        errorMessage: null,
        phase: "queued",
        remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
        statusMessage: "Searching for an opponent...",
      };
    }

    case "STREAM_QUEUED": {
      const elapsed = Math.max(0, action.elapsedSeconds);
      const isApproachingFallback = elapsed >= BOT_FALLBACK_NOTICE_SECONDS;
      return {
        ...state,
        elapsedSeconds: elapsed,
        errorMessage: null,
        phase: "queued",
        statusMessage: isApproachingFallback
          ? "No live challenger yet — matching against your Personal Record at 05:00"
          : action.message || "Searching for an opponent...",
      };
    }

    case "STREAM_MATCHED": {
      const remaining = computeRemainingReadySeconds(
        action.match.readyDeadlineIso,
        action.nowMs ?? Date.now(),
      );
      const nextPhase: SoloMatchLobbyPhase = remaining <= 0 ? "expired" : "matched";
      return {
        activeMatch: action.match,
        elapsedSeconds: state.elapsedSeconds,
        errorMessage:
          nextPhase === "expired"
            ? "Check-in window expired before both players entered the arena."
            : null,
        phase: nextPhase,
        remainingReadySeconds: remaining,
        statusMessage:
          nextPhase === "expired"
            ? "Match check-in expired"
            : "Opponent found! Enter the arena within 60 seconds.",
      };
    }

    case "READY_TICK": {
      if (state.phase !== "matched" || !state.activeMatch) {
        return state;
      }
      if (state.activeMatch.status === "IN_PROGRESS") {
        return state;
      }
      const remaining = state.activeMatch.readyDeadlineIso
        ? computeRemainingReadySeconds(
            state.activeMatch.readyDeadlineIso,
            action.nowMs ?? Date.now(),
          )
        : Math.max(0, state.remainingReadySeconds - 1);

      if (remaining <= 0) {
        return {
          ...state,
          errorMessage: "Check-in window expired before both players entered the arena.",
          phase: "expired",
          remainingReadySeconds: 0,
          statusMessage: "Match check-in expired",
        };
      }
      return {
        ...state,
        remainingReadySeconds: remaining,
      };
    }

    case "STREAM_CANCELLED": {
      return {
        activeMatch: null,
        elapsedSeconds: 0,
        errorMessage: null,
        phase: "idle",
        remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
        statusMessage: action.message || "Queue search cancelled",
      };
    }

    case "STREAM_TIMEOUT": {
      return {
        activeMatch: null,
        elapsedSeconds: state.elapsedSeconds,
        errorMessage: action.message || "Matchmaking timed out. Please try again.",
        phase: "error",
        remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
        statusMessage: "Matchmaking timed out",
      };
    }

    case "STREAM_ERROR": {
      return {
        ...state,
        errorMessage: action.errorMessage,
        phase: "error",
        statusMessage: "Connection interrupted",
      };
    }

    case "RESET_TO_IDLE": {
      return {
        activeMatch: null,
        elapsedSeconds: 0,
        errorMessage: null,
        phase: "idle",
        remainingReadySeconds: CHECKIN_WINDOW_SECONDS,
        statusMessage: "Ready to find an opponent",
      };
    }
  }
}
