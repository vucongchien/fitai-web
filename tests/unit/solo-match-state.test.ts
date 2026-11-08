import { describe, expect, it } from "vitest";

import {
  computeRelativeLaneProgress,
  computeRemainingReadySeconds,
  createInitialMatchmakingState,
  formatChallengeScore,
  formatSecondsClock,
  reduceMatchmakingState,
  resolveParticipants,
} from "@/features/solo-match/domain/match-state";
import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";

function makeMockMatch(overrides: Partial<SoloMatchSummary> = {}): SoloMatchSummary {
  return {
    challengeType: "REPS",
    endedAtIso: null,
    exerciseId: "push_up",
    exerciseName: "Push-Up",
    isDraw: false,
    matchId: "match-101",
    participants: [
      {
        avatarUrl: "",
        displayName: "You",
        isCompleted: false,
        result: "PENDING",
        scoreValue: 0,
        userId: "usr-me",
      },
      {
        avatarUrl: "",
        displayName: "Minjun Kim",
        isCompleted: false,
        result: "PENDING",
        scoreValue: 0,
        userId: "usr-opp",
      },
    ],
    readyDeadlineIso: new Date(1_700_000_045_000).toISOString(),
    startedAtIso: new Date(1_700_000_000_000).toISOString(),
    status: "PENDING_READY",
    timeoutAtIso: null,
    winnerId: "",
    ...overrides,
  };
}

describe("Solo Match Domain State & Invariants", () => {
  it("restores PENDING_READY match on page reload and blocks starting a duplicate queue", () => {
    const nowMs = 1_700_000_000_000;
    const activeMatch = makeMockMatch({
      readyDeadlineIso: new Date(nowMs + 42_000).toISOString(),
      status: "PENDING_READY",
    });

    const hydrated = createInitialMatchmakingState(activeMatch, nowMs);
    expect(hydrated.phase).toBe("matched");
    expect(hydrated.remainingReadySeconds).toBe(42);
    expect(hydrated.activeMatch?.matchId).toBe("match-101");

    // Attempting to start a new queue while an active match is pending ready must be blocked
    const afterQueueAttempt = reduceMatchmakingState(hydrated, { type: "START_QUEUE" });
    expect(afterQueueAttempt.phase).toBe("matched");
    expect(afterQueueAttempt.activeMatch?.matchId).toBe("match-101");
  });

  it("marks PENDING_READY match as expired if user reloads after the 60s check-in deadline", () => {
    const nowMs = 1_700_000_070_000;
    const expiredMatch = makeMockMatch({
      readyDeadlineIso: new Date(1_700_000_060_000).toISOString(),
      status: "PENDING_READY",
    });

    const state = createInitialMatchmakingState(expiredMatch, nowMs);
    expect(state.phase).toBe("expired");
    expect(state.remainingReadySeconds).toBe(0);
    expect(state.errorMessage).toContain("Check-in window expired");
  });

  it("surfaces Personal Record fallback notice at 240 seconds of queueing", () => {
    let state = createInitialMatchmakingState(null);
    state = reduceMatchmakingState(state, { type: "START_QUEUE" });
    expect(state.phase).toBe("queued");

    state = reduceMatchmakingState(state, {
      elapsedSeconds: 120,
      message: "Searching...",
      type: "STREAM_QUEUED",
    });
    expect(state.statusMessage).toBe("Searching...");

    state = reduceMatchmakingState(state, {
      elapsedSeconds: 245,
      message: "Searching...",
      type: "STREAM_QUEUED",
    });
    expect(state.statusMessage).toContain("Personal Record at 05:00");
  });

  it("transitions from matched to expired when READY_TICK reaches deadline", () => {
    const baseMs = 1_700_000_000_000;
    const match = makeMockMatch({
      readyDeadlineIso: new Date(baseMs + 5_000).toISOString(),
      status: "PENDING_READY",
    });

    let state = createInitialMatchmakingState(null, baseMs);
    state = reduceMatchmakingState(state, {
      match,
      nowMs: baseMs,
      type: "STREAM_MATCHED",
    });
    expect(state.phase).toBe("matched");
    expect(state.remainingReadySeconds).toBe(5);

    state = reduceMatchmakingState(state, {
      nowMs: baseMs + 3_000,
      type: "READY_TICK",
    });
    expect(state.phase).toBe("matched");
    expect(state.remainingReadySeconds).toBe(2);

    state = reduceMatchmakingState(state, {
      nowMs: baseMs + 5_500,
      type: "READY_TICK",
    });
    expect(state.phase).toBe("expired");
    expect(state.remainingReadySeconds).toBe(0);
  });

  it("computes relative lane progress safely without division by zero", () => {
    expect(computeRelativeLaneProgress(0, 0)).toEqual({
      leader: "tie",
      myPercent: 0,
      opponentPercent: 0,
    });

    expect(computeRelativeLaneProgress(15, 10)).toEqual({
      leader: "me",
      myPercent: 100,
      opponentPercent: 67,
    });

    expect(computeRelativeLaneProgress(8, 16)).toEqual({
      leader: "opponent",
      myPercent: 50,
      opponentPercent: 100,
    });
  });

  it("resolves me and opponent participants accurately by userId", () => {
    const match = makeMockMatch();
    const { me, opponent } = resolveParticipants(match, "usr-opp");
    expect(me?.userId).toBe("usr-opp");
    expect(opponent?.userId).toBe("usr-me");
  });

  it("formats challenge scores and clocks cleanly", () => {
    expect(formatChallengeScore(1, "REPS")).toBe("1 rep");
    expect(formatChallengeScore(18, "REPS")).toBe("18 reps");
    expect(formatChallengeScore(45, "DURATION")).toBe("45s");
    expect(formatChallengeScore(125, "DURATION")).toBe("2m 05s");
    expect(formatSecondsClock(245)).toBe("04:05");
    expect(computeRemainingReadySeconds(null, 1000, 60)).toBe(60);
  });
});
