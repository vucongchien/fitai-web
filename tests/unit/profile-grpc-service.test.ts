import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";


import {
  GetPersonalRecordsResponseSchema,
} from "@/shared/api/gen/contracts/core/workout_execution/v1/message/workout_execution_messages_pb";
import type { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import {
  GetNotificationSettingsResponseSchema,
} from "@/shared/api/gen/contracts/generic/notification/v1/message/notification_messages_pb";
import type { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import {
  GetProfileResponseSchema,
  LogPeriodicMetricsResponseSchema,
  RecoverInjuryResponseSchema,
  ReportInjuryResponseSchema,
  UpdateProfileResponseSchema,
} from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";
import type { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";

type ProfileClient = Client<typeof ProfileService>;
type WorkoutClient = Client<typeof WorkoutExecutionService>;
type NotificationClient = Client<typeof NotificationService>;

const mockGetProfile = vi.fn<ProfileClient["getProfile"]>();
const mockUpdateProfile = vi.fn<ProfileClient["updateProfile"]>();
const mockLogPeriodicMetrics = vi.fn<ProfileClient["logPeriodicMetrics"]>();
const mockReportInjury = vi.fn<ProfileClient["reportInjury"]>();
const mockRecoverInjury = vi.fn<ProfileClient["recoverInjury"]>();

const mockGetPersonalRecords = vi.fn<WorkoutClient["getPersonalRecords"]>();
const mockGetWorkoutHistory = vi.fn<WorkoutClient["getWorkoutHistory"]>();
const mockGetNotificationSettings = vi.fn<NotificationClient["getNotificationSettings"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile,
    logPeriodicMetrics: mockLogPeriodicMetrics,
    reportInjury: mockReportInjury,
    recoverInjury: mockRecoverInjury,
    getPersonalRecords: mockGetPersonalRecords,
    getWorkoutHistory: mockGetWorkoutHistory,
    getNotificationSettings: mockGetNotificationSettings,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAuthenticatedSession: () =>
    Promise.resolve({
      accessToken: "mock_jwt_access_token",
      refreshToken: "mock_jwt_refresh_token",
      userId: "usr-live-777",
    }),
  getAuthenticatedUserId: () => Promise.resolve("usr-live-777"),
  getAccessToken: () => Promise.resolve("mock_jwt_access_token"),
}));

describe("user Health Profile gRPC Services & Actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockGetProfile.mockReset();
    mockUpdateProfile.mockReset();
    mockLogPeriodicMetrics.mockReset();
    mockReportInjury.mockReset();
    mockRecoverInjury.mockReset();
    mockGetPersonalRecords.mockReset();
    mockGetNotificationSettings.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aggregates data from ProfileService, WorkoutExecutionService, and NotificationService", async () => {
    mockGetProfile.mockResolvedValue(
      create(GetProfileResponseSchema, {
        userId: "usr-live-777",
        weightKg: 70,
        heightCm: 180,
        experienceLevel: "ADVANCED",
        goals: ["BUILD_MUSCLE", "FAT_LOSS"],
        availableEquipment: ["FULL_GYM"],
        preferredMuscleGroups: ["CHEST", "BACK"],
        coachStyle: "SCIENTIFIC",
        targetWeightKg: 68,
        bodyFatPercent: 16,
        targetBodyFatPercent: 12,
        injuries: [
          {
            injuryId: "inj-99",
            muscleGroup: "SHOULDERS",
            severity: "MILD",
            notes: "Avoid overhead shoulder press",
            isRecovered: false,
            reportedAt: "2026-08-01",
          },
        ],
      }),
    );

    mockGetPersonalRecords.mockResolvedValue(
      create(GetPersonalRecordsResponseSchema, {
        records: [
          {
            exerciseId: "deadlift",
            weight: 160,
            reps: 1,
            oneRepMax: 160,
          },
        ],
      }),
    );

    mockGetNotificationSettings.mockResolvedValue(
      create(GetNotificationSettingsResponseSchema, {
        enablePush: true,
        enableEmail: false,
        quietHoursStart: "23:00",
        quietHoursEnd: "06:00",
      }),
    );

    mockGetWorkoutHistory.mockResolvedValue({
      sessions: [
        {
          sessionId: "sess-1",
          totalSets: 3,
          totalVolume: 2400,
          averageFormScore: 92,
        },
      ],
    } as any);

    const { getProfileData } = await import("@/features/profile/server/get-profile-data");
    const result = await getProfileData();

    expect(result.user.id).toBe("usr-live-777");
    expect(result.user.experienceLevel).toBe("Advanced");
    expect(result.highlights.currentWeightKg).toBe(70);
    expect(result.bestPr?.oneRepMax).toBe(160);
    expect(result.injuries).toHaveLength(1);
    expect(result.injuries[0].id).toBe("inj-99");
  });

  it("falls back to local safe defaults when gRPC backend throws an error", async () => {
    mockGetProfile.mockRejectedValue(new Error("gRPC network timeout"));

    const { getProfileData } = await import("@/features/profile/server/get-profile-data");
    const result = await getProfileData();

    expect(result).toBeDefined();
    expect(result.user.name).toContain("Athlete");
    expect(result.highlights.currentWeightKg).toBe(0);
  });

  it("updateProfileServerAction sends mapped enums to gRPC UpdateProfile", async () => {
    mockUpdateProfile.mockResolvedValue(
      create(UpdateProfileResponseSchema, { success: true, message: "Updated" }),
    );

    const { updateProfileServerAction } = await import(
      "@/features/profile/server/profile-actions"
    );
    const res = await updateProfileServerAction({
      highlights: { currentWeightKg: 72, bodyFatPercent: 17, targetWeightKg: 68 },
      healthMetrics: {
        heightCm: 178,
        bmi: 22.7,
        bmiCategory: "Normal",
        targetBodyFatPercent: 14,
        goals: ["Build Muscle"],
        preferredMuscleGroups: ["Chest", "Back"],
      },
      settings: {
        availableEquipment: ["Full Gym"],
        preferredWorkoutTimes: ["Mon PM"],
        coachStyle: "Scientific",
      },
    });

    expect(mockUpdateProfile).toHaveBeenCalled();
    expect(res.success).toBe(true);
  });

  it("logBodyMetricsServerAction calls gRPC LogPeriodicMetrics", async () => {
    mockLogPeriodicMetrics.mockResolvedValue(
      create(LogPeriodicMetricsResponseSchema, {
        logId: "log-123",
        userId: "usr-live-777",
        weightKg: 71.5,
        bodyFatPercent: 16.5,
        message: "Saved",
      }),
    );

    const { logBodyMetricsServerAction } = await import(
      "@/features/profile/server/profile-actions"
    );
    const res = await logBodyMetricsServerAction({
      weightKg: 71.5,
      bodyFatPercent: 16.5,
      heightCm: 178,
    });

    expect(mockLogPeriodicMetrics).toHaveBeenCalledWith({
      weightKg: 71.5,
      bodyFatPercent: 16.5,
      heightCm: 178,
      progressPhotoUrl: "",
    });
    expect(res.success).toBe(true);
    expect(res.logId).toBe("log-123");
  });

  it("reportInjuryServerAction and recoverInjuryServerAction manage injury lifecycle", async () => {
    mockReportInjury.mockResolvedValue(
      create(ReportInjuryResponseSchema, {
        injuryId: "inj-456",
        success: true,
        message: "Injury logged",
      }),
    );
    mockRecoverInjury.mockResolvedValue(
      create(RecoverInjuryResponseSchema, { success: true, message: "Recovered" }),
    );

    const { reportInjuryServerAction, recoverInjuryServerAction } = await import(
      "@/features/profile/server/profile-actions"
    );

    const reportRes = await reportInjuryServerAction({
      muscleGroup: "Knee",
      severity: "Moderate",
      notes: "Slight pain during deep squat",
    });

    expect(mockReportInjury).toHaveBeenCalledWith({
      muscleGroup: "KNEE",
      severity: "MODERATE",
      notes: "Slight pain during deep squat",
    });
    expect(reportRes.success).toBe(true);
    expect(reportRes.injuryId).toBe("inj-456");

    const recoverRes = await recoverInjuryServerAction("inj-456");
    expect(mockRecoverInjury).toHaveBeenCalledWith({ injuryId: "inj-456" });
    expect(recoverRes.success).toBe(true);
  });
});
