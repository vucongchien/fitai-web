import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getHomePageData } from "@/features/home/server/get-home-page-data";
import { RoadmapPhase, SessionPlanStatus } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";

const mockGetActiveRoadmap = vi.fn();
const mockGetTodayMenu = vi.fn();

vi.mock("@connectrpc/connect", () => ({
  createClient: () => ({
    getActiveRoadmap: mockGetActiveRoadmap,
    getTodayMenu: mockGetTodayMenu,
    getNutritionSummary: vi.fn().mockResolvedValue({ consumedCalories: 0, targetCalories: 2000 }),
    getNutritionHistory: vi.fn().mockResolvedValue({ meals: [] }),
    getProfile: vi.fn().mockResolvedValue({ profile: {} }),
    getPersonalRecords: vi.fn().mockResolvedValue({ records: [] }),
    getWorkoutHistory: vi.fn().mockResolvedValue({ sessions: [] }),
    searchExercises: vi.fn().mockResolvedValue({ exercises: [] }),
  }),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: () => ({}),
}));

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: () => Promise.resolve("mock_access_token"),
  getAuthenticatedUserId: () => Promise.resolve("usr_test_123"),
  getAuthenticatedSession: () =>
    Promise.resolve({
      accessToken: "mock_access_token",
      userId: "usr_test_123",
      userName: "Test User",
    }),
}));

describe("Home Page Today Timeline Routing & Filtering", () => {
  beforeEach(() => {
    vi.stubEnv("FITAI_RPC_URL", "http://localhost:8080");
    mockGetActiveRoadmap.mockReset();
    mockGetTodayMenu.mockReset();
    mockGetTodayMenu.mockResolvedValue({ meals: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("routes today workout directly to roadmap detail /roadmap/[sessionPlanId]", async () => {
    const today = new Date();
    mockGetActiveRoadmap.mockResolvedValue({
      roadmap: {
        weekPlans: [
          {
            weekNumber: 1,
            phase: RoadmapPhase.ACCUMULATION,
            targetRpe: 7,
            dayPlans: [
              {
                scheduledDate: {
                  year: today.getFullYear(),
                  month: today.getMonth() + 1,
                  day: today.getDate(),
                },
                sessionPlans: [
                  {
                    sessionPlanId: "sp-chest-day-999",
                    targetMuscleGroups: ["Chest", "Triceps"],
                    status: SessionPlanStatus.PENDING,
                    slotTime: "17:30",
                    reasoning: "Chest strength focus",
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const data = await getHomePageData();
    const workoutItem = data.todayTimeline.find((item) => item.category === "workout");

    expect(workoutItem).toBeDefined();
    expect(workoutItem?.href).toBe("/roadmap/sp-chest-day-999");
    expect(workoutItem?.title).toBe("Chest, Triceps");
  });

  it("does not insert any future workout item into Home when today has no scheduled workout", async () => {
    mockGetActiveRoadmap.mockResolvedValue({
      roadmap: {
        weekPlans: [
          {
            weekNumber: 1,
            phase: RoadmapPhase.ACCUMULATION,
            dayPlans: [
              {
                scheduledDate: { year: 2026, month: 8, day: 10 },
                sessionPlans: [
                  {
                    sessionPlanId: "sp-future-leg-day",
                    targetMuscleGroups: ["Legs"],
                    status: SessionPlanStatus.PENDING,
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const data = await getHomePageData();
    const workoutItem = data.todayTimeline.find((item) => item.category === "workout");

    expect(workoutItem).toBeUndefined();
  });

  it("correctly parses backend array-formatted todayMenu into todayTimeline meals", async () => {
    mockGetActiveRoadmap.mockResolvedValue({ roadmap: null });
    mockGetTodayMenu.mockResolvedValue({
      meals: [
        {
          mealType: "Breakfast",
          options: [{ mealName: "550a1b2c-1111-2222-3333-444455556666-Pho Bo Dac Biet", calories: 450 }],
        },
        {
          mealType: "Lunch",
          options: [{ mealName: "Com Tam Suon Nuong", calories: 650 }],
        },
      ],
    });

    const data = await getHomePageData();
    const mealItems = data.todayTimeline.filter((item) => item.category === "meal");

    expect(mealItems).toHaveLength(2);
    expect(mealItems[0]?.title).toBe("Breakfast");
    expect(mealItems[0]?.subtitle).toBe("Pho Bo Dac Biet");
    expect(mealItems[0]?.href).toBe("/nutrition/breakfast");
    expect(mealItems[1]?.title).toBe("Lunch");
    expect(mealItems[1]?.subtitle).toBe("Com Tam Suon Nuong");
    expect(mealItems[1]?.href).toBe("/nutrition/lunch");
  });
});
