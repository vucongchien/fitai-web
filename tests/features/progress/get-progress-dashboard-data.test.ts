import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRedirect,
  mockGetAuthenticatedSession,
  mockCreateServerTransport,
  mockGetProfile,
  mockGetBodyMetricsHistory,
  mockGetInjuryHistory,
  mockGetWorkoutHistory,
  mockGetActiveRoadmap,
} = vi.hoisted(() => ({
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  mockGetAuthenticatedSession: vi.fn(),
  mockCreateServerTransport: vi.fn(() => ({})),
  mockGetProfile: vi.fn(),
  mockGetBodyMetricsHistory: vi.fn(),
  mockGetInjuryHistory: vi.fn(),
  mockGetWorkoutHistory: vi.fn(),
  mockGetActiveRoadmap: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));
vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: mockGetAuthenticatedSession,
}));
vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: mockCreateServerTransport,
}));
vi.mock("@connectrpc/connect", () => ({
  createClient: (service: { typeName?: string }) => {
    if (service.typeName?.includes("ProfileService")) {
      return {
        getProfile: mockGetProfile,
        getBodyMetricsHistory: mockGetBodyMetricsHistory,
        getInjuryHistory: mockGetInjuryHistory,
      };
    }
    if (service.typeName?.includes("WorkoutExecutionService")) {
      return {
        getWorkoutHistory: mockGetWorkoutHistory,
      };
    }
    return {
      getActiveRoadmap: mockGetActiveRoadmap,
    };
  },
}));

import { getProgressDashboardData } from "@/features/progress/server/get-progress-dashboard-data";

describe("getProgressDashboardData", () => {
  const originalRpcUrl = process.env.FITAI_RPC_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FITAI_RPC_URL = "http://localhost:50051";
    mockGetAuthenticatedSession.mockResolvedValue({
      accessToken: "token-123",
      userId: "user-9876",
      userName: "Alex",
    });
  });

  afterEach(() => {
    process.env.FITAI_RPC_URL = originalRpcUrl;
  });

  it("redirects to /login when unauthenticated", async () => {
    mockGetAuthenticatedSession.mockResolvedValue({
      accessToken: null,
      userId: null,
      userName: null,
    });

    await expect(getProgressDashboardData()).rejects.toThrow("REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("returns fallback data when FITAI_RPC_URL is not configured", async () => {
    delete process.env.FITAI_RPC_URL;

    const result = await getProgressDashboardData();

    expect(result.athleteName).toBe("Alex");
    expect(result.entries).toEqual([]);
    expect(result.heatmapWeeks).toHaveLength(12);
    expect(result.weeklyGoal).toEqual({ completed: 0, target: 4, percentage: 0 });
  });

  it("maps gRPC responses and falls back to workout history for weeklyGoal when no roadmap exists", async () => {
    const nowSec = Math.floor(Date.now() / 1000);

    mockGetProfile.mockResolvedValue({
      fullName: "Alex Rivera",
      heightCm: 175,
      weightKg: 74,
      bodyFatPercent: 18,
      targetWeightKg: 70,
      targetBodyFatPercent: 15,
      preferredMuscleGroups: ["CHEST", "BACK"],
      preferredWorkoutTimes: ["07:00", "18:00", "19:00", "08:00"],
    });
    mockGetBodyMetricsHistory.mockResolvedValue({
      metrics: [
        {
          id: "m1",
          weightKg: 73.5,
          bodyFatPercent: 17.8,
          heightCm: 0,
          progressPhotoUrl: "https://images.unsplash.com/photo-1",
          loggedAt: "2026-11-01T08:00:00Z",
        },
      ],
    });
    mockGetInjuryHistory.mockResolvedValue({
      injuries: [
        { muscleGroup: "SHOULDERS", severity: "MILD", isRecovered: false },
        { muscleGroup: "KNEE", severity: "MILD", isRecovered: true },
      ],
    });
    mockGetWorkoutHistory.mockResolvedValue({
      sessions: [
        { sessionId: "s1", date: { seconds: nowSec }, totalSets: 12, totalVolume: 2400 },
        {
          sessionId: "s2",
          date: { seconds: nowSec - 86400 },
          totalSets: 10,
          totalVolume: 1800,
        },
      ],
    });
    mockGetActiveRoadmap.mockRejectedValue(new Error("No active roadmap"));

    const result = await getProgressDashboardData();

    expect(result.athleteName).toBe("Alex Rivera");
    expect(result.currentWeightKg).toBe(73.5);
    expect(result.heightCm).toBe(175);
    expect(result.photos).toHaveLength(1);
    expect(result.activeInjuries).toEqual([{ muscleGroup: "SHOULDERS", severity: "MILD" }]);
    expect(result.totalWorkouts).toBe(2);
    expect(result.totalVolumeKg).toBe(4200);
    expect(result.weeklyGoal).toEqual({ completed: 2, target: 4, percentage: 50 });
  });
});
