import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  cancelMatchQueueClient,
  fetchActiveMatchClient,
  streamJoinQueue,
} from "@/features/solo-match/api/solo-match-client";
import type {
  ChallengePageData,
  SoloMatchSummary,
} from "@/features/solo-match/model/solo-match.types";
import { ChallengeLobbyView } from "@/features/solo-match/ui/challenge-lobby-view";
import { ChallengeResultView } from "@/features/solo-match/ui/challenge-result-view";

vi.mock<typeof import("next/link")>(import("next/link"), () => ({
  default: ({
    children,
    href,
    transitionTypes: _transitionTypes,
    ...props
  }: React.ComponentPropsWithRef<"a"> & { transitionTypes?: string[] }) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));

vi.mock<typeof import("@/features/solo-match/api/solo-match-client")>(
  import("@/features/solo-match/api/solo-match-client"),
  () => ({
    cancelMatchQueueClient: vi.fn().mockResolvedValue(true),
    fetchActiveMatchClient: vi.fn().mockResolvedValue(null),
    fetchMatchByIdClient: vi.fn().mockResolvedValue(null),
    streamJoinQueue: vi.fn(),
  }),
);

function buildSampleMatch(overrides: Partial<SoloMatchSummary> = {}): SoloMatchSummary {
  return {
    ceilingSeconds: 300,
    challengeType: "REPS",
    endedAtIso: "2026-11-07T12:05:00.000Z",
    exerciseId: "ex-pushup",
    exerciseName: "Push-up",
    isDraw: false,
    matchId: "match-alpha-99",
    participants: [
      {
        avatarUrl: "",
        displayName: "Minjun",
        formScore: 95,
        isCompleted: true,
        result: "WIN",
        scoreValue: 44,
        userId: "user-me",
      },
      {
        avatarUrl: "",
        displayName: "Jihoon",
        formScore: 89,
        isCompleted: true,
        result: "LOSE",
        scoreValue: 37,
        userId: "user-rival",
      },
    ],
    readyDeadlineIso: new Date(Date.now() + 48_000).toISOString(),
    startedAtIso: "2026-11-07T12:00:00.000Z",
    status: "COMPLETED",
    timeoutAtIso: "2026-11-07T12:05:00.000Z",
    winnerId: "user-me",
    ...overrides,
  };
}

describe("Solo Challenge Lobby & Result Views", () => {
  it("renders idle lobby with Find Match CTA and recent match history", () => {
    const pageData: ChallengePageData = {
      activeMatch: null,
      currentUserId: "user-me",
      history: [buildSampleMatch()],
      isPreview: false,
    };

    render(<ChallengeLobbyView data={pageData} />);

    expect(screen.getByTestId("find-match-button")).toBeInTheDocument();
    expect(screen.getByText("Push-up")).toBeInTheDocument();
    expect(screen.getByText("Jihoon")).toBeInTheDocument();
  });

  it("transitions to queued card when Find Match is clicked and cancels cleanly", async () => {
    vi.mocked(streamJoinQueue).mockImplementation(async (options) => {
      options.onQueued(4, "Searching for a challenger at your level...");
      await new Promise<void>((resolve) => {
        options.signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    const pageData: ChallengePageData = {
      activeMatch: null,
      currentUserId: "user-me",
      history: [],
      isPreview: false,
    };

    render(<ChallengeLobbyView data={pageData} />);

    fireEvent.click(screen.getByTestId("find-match-button"));

    await waitFor(() => {
      expect(screen.getByTestId("cancel-queue-button")).toBeInTheDocument();
      expect(screen.getByText("00:04")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("cancel-queue-button"));

    await waitFor(() => {
      expect(screen.getByTestId("find-match-button")).toBeInTheDocument();
    });
    expect(cancelMatchQueueClient).toHaveBeenCalled();
  });

  it("recovers an active PENDING_READY match with check-in countdown and Enter Arena link", () => {
    const activeMatch = buildSampleMatch({
      readyDeadlineIso: new Date(Date.now() + 42_000).toISOString(),
      status: "PENDING_READY",
    });
    vi.mocked(fetchActiveMatchClient).mockResolvedValue(activeMatch);

    const pageData: ChallengePageData = {
      activeMatch,
      currentUserId: "user-me",
      history: [],
      isPreview: false,
    };

    render(<ChallengeLobbyView data={pageData} />);

    const enterLink = screen.getByTestId("enter-arena-link");
    expect(enterLink).toBeInTheDocument();
    expect(enterLink).toHaveAttribute("href", "/challenge/match-alpha-99");
    expect(screen.getByText("Opponent Matched")).toBeInTheDocument();
  });

  it("renders ChallengeResultView with Victory badge, scores, and form percentages", () => {
    const completedMatch = buildSampleMatch();

    render(<ChallengeResultView currentUserId="user-me" match={completedMatch} />);

    expect(screen.getByTestId("match-outcome-badge")).toHaveTextContent("Victory");
    expect(screen.getByTestId("result-my-score")).toHaveTextContent("44 reps");
    expect(screen.getByTestId("result-opponent-score")).toHaveTextContent("37 reps");
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("89%")).toBeInTheDocument();
    expect(screen.getByTestId("play-again-link")).toHaveAttribute("href", "/challenge");
  });
});
