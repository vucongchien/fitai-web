import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SoloMatchSummary } from "@/features/solo-match/model/solo-match.types";
import { useSoloDuel } from "@/features/solo-match/model/use-solo-duel";
import { DuelArenaView } from "@/features/solo-match/ui/duel-arena-view";

const pushMock = vi.fn();

vi.mock<typeof import("next/navigation")>(import("next/navigation"), () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

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

vi.mock<typeof import("@/features/solo-match/model/use-solo-duel")>(
  import("@/features/solo-match/model/use-solo-duel"),
  () => ({
    useSoloDuel: vi.fn(),
  }),
);

function buildLiveMatch(): SoloMatchSummary {
  return {
    ceilingSeconds: 300,
    challengeType: "REPS",
    endedAtIso: null,
    exerciseId: "ex-squat",
    exerciseName: "Bodyweight Squat",
    isDraw: false,
    matchId: "match-live-777",
    participants: [
      {
        avatarUrl: "",
        displayName: "Minjun",
        isCompleted: false,
        result: "PENDING",
        scoreValue: 18,
        userId: "user-me",
      },
      {
        avatarUrl: "",
        displayName: "Seojun",
        isCompleted: false,
        result: "PENDING",
        scoreValue: 15,
        userId: "user-rival",
      },
    ],
    readyDeadlineIso: null,
    startedAtIso: "2026-11-07T12:00:00.000Z",
    status: "IN_PROGRESS",
    timeoutAtIso: "2026-11-07T12:05:00.000Z",
    winnerId: "",
  };
}

describe(DuelArenaView, () => {
  it("renders live scoreboard with both lanes, ceiling timer, and opens Submit Score confirmation modal", () => {
    const submitScoreMock = vi.fn().mockResolvedValue(undefined);
    const forfeitMatchMock = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "ready",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: forfeitMatchMock,
      liveState: {
        connectionPhase: "connected",
        currentAngle: 92,
        detectedErrors: [],
        isSettling: false,
        lastCoachCue: "Solid squat depth!",
        matchEnded: false,
        myFormScore: 96,
        myStatus: "ACTIVE",
        myValue: 18,
        opponentFormScore: 91,
        opponentStatus: "ACTIVE",
        opponentValue: 15,
        personDetected: true,
        reconnectAttempt: 0,
        remainingCeilingSeconds: 215,
        repPhase: "active",
      },
      pose: null,
      submitScore: submitScoreMock,
    });

    render(
      <DuelArenaView
        currentUserId="user-me"
        match={buildLiveMatch()}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    expect(screen.getByTestId("duel-my-score")).toHaveTextContent("18 reps");
    expect(screen.getByTestId("duel-opponent-score")).toHaveTextContent("15 reps");
    expect(screen.getByTestId("duel-lead-badge")).toHaveTextContent("+3");
    const hud = screen.getByTestId("duel-versus-hud");
    expect(hud).toHaveClass("w-full");
    expect(hud).not.toHaveClass("max-w-[640px]");
    const tugBar = screen.getByTestId("duel-tug-of-war-bar");
    expect(tugBar).toHaveAttribute("data-my-share", "55");
    expect(within(tugBar).getByTestId("duel-my-bar-score")).toHaveTextContent("18");
    expect(within(tugBar).getByTestId("duel-opponent-bar-score")).toHaveTextContent("15");
    expect(screen.getByTestId("duel-rep-gauge")).toBeInTheDocument();
    const repThreshold = screen.getByTestId("duel-rep-threshold");
    expect(repThreshold).toHaveAttribute("data-threshold", "85");
    expect(repThreshold).toHaveStyle({ bottom: "85%" });
    expect(repThreshold).toHaveTextContent("85%");
    expect(screen.getByTestId("duel-particle-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("duel-ceiling-timer")).toHaveTextContent("03:35");
    expect(screen.queryByText("Solid squat depth!")).not.toBeInTheDocument();

    // Verify raw debug information is not exposed in standard user-facing mode
    expect(screen.queryByText(/match-live-777/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/#match/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Angle:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Attempt/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upload video/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("open-submit-modal-button"));
    expect(screen.getByText("Lock In Your Score?")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("confirm-modal-action-button"));
    expect(submitScoreMock).toHaveBeenCalledTimes(1);
  });

  it("renders Spectating Mode when player has submitted their score and is waiting for rival", () => {
    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "idle",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: vi.fn(),
      liveState: {
        connectionPhase: "connected",
        currentAngle: 0,
        detectedErrors: [],
        isSettling: false,
        lastCoachCue: "",
        matchEnded: false,
        myFormScore: 97,
        myStatus: "SPECTATING",
        myValue: 30,
        opponentFormScore: 88,
        opponentStatus: "ACTIVE",
        opponentValue: 26,
        personDetected: false,
        reconnectAttempt: 0,
        remainingCeilingSeconds: 120,
        repPhase: "idle",
      },
      pose: null,
      submitScore: vi.fn(),
    });

    render(
      <DuelArenaView
        currentUserId="user-me"
        match={buildLiveMatch()}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    expect(screen.getByTestId("spectating-stage")).toBeInTheDocument();
    expect(screen.getByText(/Your Score Is Locked In \(30 reps\)/i)).toBeInTheDocument();
  });

  it("renders Settlement Splash overlay when liveState.isSettling is true", () => {
    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "idle",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: vi.fn(),
      liveState: {
        connectionPhase: "ended",
        currentAngle: 0,
        detectedErrors: [],
        isSettling: true,
        lastCoachCue: "",
        matchEnded: true,
        myFormScore: 95,
        myStatus: "COMPLETED",
        myValue: 6,
        opponentFormScore: 90,
        opponentStatus: "COMPLETED",
        opponentValue: 5,
        personDetected: false,
        reconnectAttempt: 0,
        remainingCeilingSeconds: 0,
        repPhase: "idle",
      },
      pose: null,
      submitScore: vi.fn(),
    });

    render(
      <DuelArenaView
        currentUserId="user-me"
        match={buildLiveMatch()}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    const splash = screen.getByTestId("settlement-splash");
    expect(splash).toBeInTheDocument();
    expect(within(splash).getByText("Match Complete!")).toBeInTheDocument();
    expect(within(splash).getByText(/Calculating official verdict/i)).toBeInTheDocument();
    expect(within(splash).getByText("6 reps")).toBeInTheDocument();
    expect(within(splash).getByText("5 reps")).toBeInTheDocument();
  });

  it("renders combo streak badge and milestone celebration banner when comboStreak >= 3", () => {
    vi.useFakeTimers();
    try {
      vi.mocked(useSoloDuel).mockReturnValue({
        camera: {
          clearCustomVideo: vi.fn(),
          customVideoSrc: null,
          facingMode: "user",
          flip: vi.fn(),
          isCustomVideo: false,
          loadVideoFile: vi.fn(),
          start: vi.fn(),
          state: "ready",
          stop: vi.fn(),
          videoRef: { current: null },
        },
        forfeitMatch: vi.fn(),
        liveState: {
          comboStreak: 5,
          connectionPhase: "connected",
          currentAngle: 95,
          detectedErrors: [],
          isSettling: false,
          lastCoachCue: "",
          lastMilestone: 5,
          lastRepConfirmedAtMs: 1_700_000_005_000,
          matchEnded: false,
          myFormScore: 98,
          myStatus: "ACTIVE",
          myValue: 5,
          opponentFormScore: 89,
          opponentStatus: "ACTIVE",
          opponentValue: 4,
          personDetected: true,
          reconnectAttempt: 0,
          remainingCeilingSeconds: 240,
          repPhase: "active",
        },
        pose: null,
        submitScore: vi.fn(),
      });

      render(
        <DuelArenaView
          currentUserId="user-me"
          match={buildLiveMatch()}
          onnxSkeletonUrl="/models/yolo11n-pose.onnx"
          recommendedCameraAngle="side"
        />,
      );

      expect(screen.getByTestId("duel-combo-badge")).toHaveTextContent("5x COMBO");
      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByTestId("duel-combo-milestone-banner")).toHaveTextContent("5x ON FIRE!");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the tug-of-war divider mounted across score updates and shows FORM gauge for DURATION", () => {
    const baseState = {
      connectionPhase: "connected" as const,
      currentAngle: 0,
      detectedErrors: [],
      isSettling: false,
      lastCoachCue: "",
      matchEnded: false,
      myFormScore: 88,
      myStatus: "ACTIVE" as const,
      myValue: 10,
      opponentFormScore: 85,
      opponentStatus: "ACTIVE" as const,
      opponentValue: 10,
      personDetected: true,
      reconnectAttempt: 0,
      remainingCeilingSeconds: 180,
      repPhase: "active",
    };

    const durationMatch: SoloMatchSummary = {
      ...buildLiveMatch(),
      challengeType: "DURATION",
      exerciseId: "plank",
      exerciseName: "Forearm Plank",
    };

    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "ready",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: vi.fn(),
      liveState: baseState,
      pose: null,
      submitScore: vi.fn(),
    });

    const { rerender } = render(
      <DuelArenaView
        currentUserId="user-me"
        match={durationMatch}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    const dividerBefore = screen.getByTestId("duel-tug-of-war-divider");
    expect(dividerBefore).toHaveStyle({ left: "50%" });
    expect(screen.getByTestId("duel-rep-gauge")).toHaveAttribute("data-percent", "88");
    expect(screen.getByTestId("duel-rep-gauge")).toHaveTextContent("FORM");
    expect(screen.queryByTestId("duel-rep-threshold")).not.toBeInTheDocument();

    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "ready",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: vi.fn(),
      liveState: { ...baseState, myValue: 15, opponentValue: 10 },
      pose: null,
      submitScore: vi.fn(),
    });

    rerender(
      <DuelArenaView
        currentUserId="user-me"
        match={durationMatch}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    const dividerAfter = screen.getByTestId("duel-tug-of-war-divider");
    expect(dividerAfter).toBe(dividerBefore);
    expect(dividerAfter).toHaveStyle({ left: "60%" });
  });

  it("renders in-bar scores at 12% minimum clamp width and highlights 85% rep threshold", () => {
    vi.mocked(useSoloDuel).mockReturnValue({
      camera: {
        clearCustomVideo: vi.fn(),
        customVideoSrc: null,
        facingMode: "user",
        flip: vi.fn(),
        isCustomVideo: false,
        loadVideoFile: vi.fn(),
        start: vi.fn(),
        state: "ready",
        stop: vi.fn(),
        videoRef: { current: null },
      },
      forfeitMatch: vi.fn(),
      liveState: {
        connectionPhase: "connected",
        currentAngle: 95,
        detectedErrors: [],
        isSettling: false,
        lastCoachCue: "Keep going!",
        matchEnded: false,
        myFormScore: 95,
        myStatus: "ACTIVE",
        myValue: 100,
        opponentFormScore: 90,
        opponentStatus: "ACTIVE",
        opponentValue: 1000,
        personDetected: true,
        reconnectAttempt: 0,
        remainingCeilingSeconds: 180,
        repPhase: "active",
      },
      pose: null,
      submitScore: vi.fn(),
    });

    render(
      <DuelArenaView
        currentUserId="user-me"
        match={buildLiveMatch()}
        onnxSkeletonUrl="/models/yolo11n-pose.onnx"
        recommendedCameraAngle="side"
      />,
    );

    const tugBar = screen.getByTestId("duel-tug-of-war-bar");
    expect(tugBar).toHaveAttribute("data-my-share", "12");
    expect(tugBar).toHaveAttribute("data-opponent-share", "88");
    expect(within(tugBar).getByTestId("duel-my-bar-score")).toHaveTextContent("100");
    expect(within(tugBar).getByTestId("duel-opponent-bar-score")).toHaveTextContent("1000");
    expect(screen.getByTestId("duel-rep-threshold")).toHaveAttribute("data-threshold", "85");
    expect(screen.queryByText("Keep going!")).not.toBeInTheDocument();
  });
});
