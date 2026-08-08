import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { SaveHealthProfileResponseSchema } from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";
import type { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";

type ProfileClient = Client<typeof ProfileService>;

const mockSaveHealthProfile = vi.fn<ProfileClient["saveHealthProfile"]>();

vi.mock<typeof import("@connectrpc/connect")>(import("@connectrpc/connect"), () => ({
  createClient: (_service: unknown, _transport: unknown) => ({
    saveHealthProfile: mockSaveHealthProfile,
  }),
}));

vi.mock<typeof import("@/shared/api/server/transport")>(
  import("@/shared/api/server/transport"),
  () => ({
    createServerTransport: vi.fn<() => Transport>(() => ({}) as Transport),
  }),
);

vi.mock<typeof import("@/shared/auth/session")>(import("@/shared/auth/session"), () => ({
  getAccessToken: () => Promise.resolve("valid_token_xyz"),
  getAuthenticatedUserId: () => Promise.resolve("usr-onboarding-123"),
}));

describe("Onboarding Server Actions & Enum Normalization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSaveHealthProfile.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes and sends multi-goals, preferredWorkoutTimes array, DOB, and bodyFatPercent to gRPC SaveHealthProfile", async () => {
    mockSaveHealthProfile.mockResolvedValue(
      create(SaveHealthProfileResponseSchema, {
        userId: "usr-onboarding-123",
        completionRate: 100,
        aiCoachActivated: true,
        message: "Profile saved successfully",
      }),
    );

    const { saveOnboardingProfileServerAction } = await import(
      "@/features/onboarding/server/onboarding-actions"
    );

    const result = await saveOnboardingProfileServerAction({
      weightKg: 75,
      heightCm: 182,
      dateOfBirth: "1995-10-20",
      gender: "male",
      goals: ["build-muscle", "fat-loss"],
      bodyFatPercent: 18.5,
      targetBodyFatPercent: 14,
      experienceLevel: "intermediate",
      preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
      equipment: ["Full Gym", "Dumbbells", "Barbell", "Bodyweight", "Resistance Band"],
      muscleFocus: ["Chest", "Back", "Legs"],
      coachStyle: "scientific",
      targetWeightKg: 78,
      injuryStatus: "active",
      injuryMuscleGroup: "Shoulders",
      injurySeverity: "MILD",
      injuryNotes: "Minor impingement",
    });

    expect(mockSaveHealthProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        weightKg: 75,
        heightCm: 182,
        gender: "MALE",
        dateOfBirth: "1995-10-20",
        bodyFatPercent: 18.5,
        targetBodyFatPercent: 14,
        goals: ["BUILD_MUSCLE", "FAT_LOSS"],
        preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
        experienceLevel: "INTERMEDIATE",
        coachStyle: "SCIENTIFIC",
        availableEquipment: [
          "FULL_GYM",
          "DUMBBELL_ONLY",
          "BARBELL",
          "BODYWEIGHT",
          "RESISTANCE_BAND",
        ],
        preferredMuscleGroups: ["CHEST", "BACK", "LEGS"],
        injuries: [
          {
            muscleGroup: "SHOULDERS",
            severity: "MILD",
            notes: "Minor impingement",
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
    expect(result.aiCoachActivated).toBe(true);
  });

  it("omits injuries array when injuryStatus is none and supports single goal string fallback", async () => {
    mockSaveHealthProfile.mockResolvedValue(
      create(SaveHealthProfileResponseSchema, {
        userId: "usr-onboarding-123",
        completionRate: 100,
        aiCoachActivated: true,
      }),
    );

    const { saveOnboardingProfileServerAction } = await import(
      "@/features/onboarding/server/onboarding-actions"
    );

    await saveOnboardingProfileServerAction({
      weightKg: 65,
      heightCm: 170,
      dateOfBirth: "2000-01-01",
      gender: "female",
      goal: "fat-loss",
      bodyFatPercent: 22,
      experienceLevel: "beginner",
      preferredWorkoutTimes: ["Tue AM", "Thu AM"],
      equipment: ["Bodyweight"],
      muscleFocus: ["Core"],
      coachStyle: "motivational",
      targetWeightKg: 60,
      injuryStatus: "none",
    });

    expect(mockSaveHealthProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        goals: ["FAT_LOSS"],
        preferredWorkoutTimes: ["Tue AM", "Thu AM"],
        experienceLevel: "BEGINNER",
        coachStyle: "MOTIVATIONAL",
        availableEquipment: ["BODYWEIGHT"],
        injuries: [],
      }),
    );
  });

  it("recovers gracefully when gRPC SaveHealthProfile throws", async () => {
    mockSaveHealthProfile.mockRejectedValue(new Error("Connection reset"));

    const { saveOnboardingProfileServerAction } = await import(
      "@/features/onboarding/server/onboarding-actions"
    );

    const result = await saveOnboardingProfileServerAction({
      weightKg: 80,
      heightCm: 175,
      gender: "male",
      goals: ["build-muscle"],
      bodyFatPercent: 17,
      experienceLevel: "advanced",
      preferredWorkoutTimes: ["Mon PM"],
      equipment: ["Full Gym"],
      muscleFocus: ["Arms"],
      coachStyle: "strict",
      targetWeightKg: 82,
      injuryStatus: "none",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Connection reset");
  });
});
