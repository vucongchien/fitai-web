import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "@bufbuild/protobuf";
import type { Transport } from "@connectrpc/connect";

import { GetSessionPlanResponseSchema } from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import { GetExerciseResponseSchema } from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";

const mockGetSessionPlan = vi.fn();
const mockStartWorkoutSession = vi.fn();
const mockGetExercise = vi.fn();
const mockGetMotionSpecification = vi.fn();
const mockGetWorkoutHistory = vi.fn();
const mockGetPersonalRecords = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@connectrpc/connect", () => ({
  createClient: (service: any) => {
    if (service?.typeName?.includes("CoachingService")) {
      return { getSessionPlan: mockGetSessionPlan };
    }
    if (service?.typeName?.includes("ExerciseService")) {
      return { getExercise: mockGetExercise };
    }
    return {
      startWorkoutSession: mockStartWorkoutSession,
      getMotionSpecification: mockGetMotionSpecification,
      getWorkoutHistory: mockGetWorkoutHistory,
      getPersonalRecords: mockGetPersonalRecords,
    };
  },
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
}));

vi.mock("@/shared/auth/session", () => ({
  getAuthenticatedSession: () => Promise.resolve({ accessToken: "mock_jwt_token", userId: "usr_123" }),
}));

describe("getLiveSessionData gRPC Live Session Execution", () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetSessionPlan.mockReset();
    mockStartWorkoutSession.mockReset();
    mockGetExercise.mockReset();
    mockGetMotionSpecification.mockReset();
    mockGetWorkoutHistory.mockReset();
    mockGetPersonalRecords.mockReset();
    mockNotFound.mockReset();

    mockStartWorkoutSession.mockResolvedValue({ sessionId: "ses_live_active_999" });
    mockGetMotionSpecification.mockResolvedValue({ motionSpecification: undefined });
    mockGetWorkoutHistory.mockResolvedValue({ sessions: [] });
    mockGetPersonalRecords.mockResolvedValue({ records: [] });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fetches session plan and exercises from gRPC services directly", async () => {
    mockGetSessionPlan.mockResolvedValue(
      create(GetSessionPlanResponseSchema, {
        sessionPlan: {
          sessionPlanId: "plan_bench_squat",
          targetMuscleGroups: ["Chest", "Legs"],
          prescription: {
            mainExercises: [
              {
                exerciseId: "ex-bench-press",
                exerciseName: "Bench Press",
                targetSets: 3,
                targetReps: 8,
                targetWeight: 60,
                restSetSec: 90,
                restExerciseSec: 120,
                targetRpe: 8,
              },
            ],
            warmUps: [],
            coolDowns: [],
          },
        },
      }),
    );

    mockGetExercise.mockResolvedValue(
      create(GetExerciseResponseSchema, {
        exercise: {
          id: "ex-bench-press",
          name: "Barbell Bench Press",
          equipmentId: "eq-barbell",
          instructions: "Hạ tạ chạm ngực rồi đẩy lên",
          hasAiSupported: true,
        },
      }),
    );

    const { getLiveSessionData } = await import(
      "@/features/workout/server/get-live-session-data"
    );

    const plan = await getLiveSessionData("plan_bench_squat");

    expect(mockGetSessionPlan).toHaveBeenCalledWith({
      userId: "usr_123",
      sessionPlanId: "plan_bench_squat",
    });
    expect(plan.sessionId).toBe("ses_live_active_999");
    expect(plan.mainExercises).toHaveLength(1);
    expect(plan.mainExercises[0]?.exerciseId).toBe("ex-bench-press");
    expect(plan.mainExercises[0]?.name).toBe("Bench Press");
    expect(plan.mainExercises[0]?.isWeighted).toBe(true);
    expect(plan.mainExercises[0]?.instructions).toBe("Hạ tạ chạm ngực rồi đẩy lên");
  });

  it("triggers notFound when session plan is not found on backend", async () => {
    mockGetSessionPlan.mockRejectedValue(new Error("rpc error: code = NotFound"));

    const { getLiveSessionData } = await import(
      "@/features/workout/server/get-live-session-data"
    );

    await expect(getLiveSessionData("invalid_plan_id")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
