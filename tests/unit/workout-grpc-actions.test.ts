import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import {
  CreateAdhocSessionPlanResponseSchema,
} from "@/shared/api/gen/contracts/core/coaching/v1/message/coaching_messages_pb";
import type { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import {
  AbortWorkoutSessionResponseSchema,
  CompleteWorkoutSessionResponseSchema,
  GetPersonalRecordsResponseSchema,
  LogWorkoutSetResponseSchema,
  StartWorkoutSessionResponseSchema,
  SyncWorkoutLogsResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import {
  GetCatalogMetadataResponseSchema,
  SearchExercisesResponseSchema,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/exercise_messages_pb";
import type { ExerciseService } from "@/shared/api/gen/contracts/supporting/exercise/v1/service/exercise_service_pb";

type CoachingClient = Client<typeof CoachingService>;
type WorkoutClient = Client<typeof WorkoutExecutionService>;
type ExerciseClient = Client<typeof ExerciseService>;

const mockCreateAdhocSessionPlan = vi.fn<CoachingClient["createAdhocSessionPlan"]>();
const mockStartWorkoutSession = vi.fn<WorkoutClient["startWorkoutSession"]>();
const mockLogWorkoutSet = vi.fn<WorkoutClient["logWorkoutSet"]>();
const mockSyncWorkoutLogs = vi.fn<WorkoutClient["syncWorkoutLogs"]>();
const mockAbortWorkoutSession = vi.fn<WorkoutClient["abortWorkoutSession"]>();
const mockCompleteWorkoutSession = vi.fn<WorkoutClient["completeWorkoutSession"]>();
const mockGetPersonalRecords = vi.fn<WorkoutClient["getPersonalRecords"]>();

const mockSearchExercises = vi.fn<ExerciseClient["searchExercises"]>();
const mockGetCatalogMetadata = vi.fn<ExerciseClient["getCatalogMetadata"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    createAdhocSessionPlan: mockCreateAdhocSessionPlan,
    startWorkoutSession: mockStartWorkoutSession,
    logWorkoutSet: mockLogWorkoutSet,
    syncWorkoutLogs: mockSyncWorkoutLogs,
    abortWorkoutSession: mockAbortWorkoutSession,
    completeWorkoutSession: mockCompleteWorkoutSession,
    getPersonalRecords: mockGetPersonalRecords,
    searchExercises: mockSearchExercises,
    getCatalogMetadata: mockGetCatalogMetadata,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("mock_jwt_token_999"),
  getAuthenticatedUserId: () => Promise.resolve("usr-workout-live"),
}));

describe("workout Execution gRPC Actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockCreateAdhocSessionPlan.mockReset();
    mockStartWorkoutSession.mockReset();
    mockLogWorkoutSet.mockReset();
    mockSyncWorkoutLogs.mockReset();
    mockAbortWorkoutSession.mockReset();
    mockCompleteWorkoutSession.mockReset();
    mockGetPersonalRecords.mockReset();
    mockSearchExercises.mockReset();
    mockGetCatalogMetadata.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("beginWorkoutSession creates adhoc plan and starts live session", async () => {
    mockCreateAdhocSessionPlan.mockResolvedValue(
      create(CreateAdhocSessionPlanResponseSchema, {
        sessionPlan: { sessionPlanId: "plan-777" },
      }),
    );
    mockStartWorkoutSession.mockResolvedValue(
      create(StartWorkoutSessionResponseSchema, {
        sessionId: "sess-live-888",
      }),
    );

    const { beginWorkoutSession } = await import(
      "@/features/workout/server/workout-actions"
    );
    const res = await beginWorkoutSession(["ex-squat"]);

    expect(mockCreateAdhocSessionPlan).toHaveBeenCalledWith({
      userId: "usr-workout-live",
      exerciseIds: ["ex-squat"],
    });
    expect(mockStartWorkoutSession).toHaveBeenCalledWith({ planId: "plan-777" });
    expect(res.sessionId).toBe("sess-live-888");
  });

  it("logWorkoutSet sends set performance to gRPC LogWorkoutSet", async () => {
    mockLogWorkoutSet.mockResolvedValue(
      create(LogWorkoutSetResponseSchema, { setLogId: "set-log-555" }),
    );

    const { logWorkoutSet } = await import(
      "@/features/workout/server/workout-actions"
    );
    const res = await logWorkoutSet("sess-live-888", {
      exerciseId: "bench",
      setNumber: 1,
      targetReps: 10,
      actualReps: 10,
      weightKg: 80,
      rpe: 8,
      formScore: 92,
      cameraAngle: "side",
    });

    expect(mockLogWorkoutSet).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-live-888",
        exerciseId: "bench",
        setNumber: 1,
        weight: 80,
        rpe: 8,
        formScore: 92,
      }),
    );
    expect(res.setLogId).toBe("set-log-555");
  });

  it("completeWorkoutSession finishes session and returns totals", async () => {
    mockCompleteWorkoutSession.mockResolvedValue(
      create(CompleteWorkoutSessionResponseSchema, {
        sessionId: "sess-live-888",
        totalSets: 3,
        totalVolume: 2400,
        averageRpe: 8,
        averageFormScore: 90,
      }),
    );

    const { completeWorkoutSession } = await import(
      "@/features/workout/server/workout-actions"
    );
    const res = await completeWorkoutSession(
      "sess-live-888",
      [
        {
          exerciseId: "bench",
          setNumber: 1,
          targetReps: 10,
          actualReps: 10,
          weightKg: 80,
          rpe: 8,
        },
      ],
      false,
    );

    expect(mockCompleteWorkoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "sess-live-888",
        confirmOverload: false,
      }),
    );
    expect(res.sessionId).toBe("sess-live-888");
    expect(res.totalSets).toBe(3);
    expect(res.totalVolumeKg).toBe(2400);
  });

  it("getPersonalRecords maps gRPC records to dictionary", async () => {
    mockGetPersonalRecords.mockResolvedValue(
      create(GetPersonalRecordsResponseSchema, {
        records: [
          { exerciseId: "deadlift", oneRepMax: 160 },
          { exerciseId: "squat", oneRepMax: 140 },
        ],
      }),
    );

    const { getPersonalRecords } = await import(
      "@/features/workout/server/workout-actions"
    );
    const prs = await getPersonalRecords(["deadlift", "squat"]);

    expect(prs).toStrictEqual({
      deadlift: 160,
      squat: 140,
    });
  });
});
