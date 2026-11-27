import { create } from "@bufbuild/protobuf";
import type { Client, Transport } from "@connectrpc/connect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OnboardingValues } from "@/features/onboarding/domain/onboarding-schema";
import { onboardingDefaults } from "@/features/onboarding/domain/onboarding-schema";
import {
  BodySide,
  Equipment,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
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

const BASE: OnboardingValues = {
  ...onboardingDefaults,
  weightKg: 75,
  heightCm: 182,
  dateOfBirth: "1995-10-20",
  gender: "male",
  goals: ["build-muscle", "fat-loss"],
  bodyFatPercent: 18.5,
  targetBodyFatPercent: 14,
  experienceLevel: "intermediate",
  preferredWorkoutTimes: { mon: ["17:30-19:00"], wed: ["17:30-19:00"], fri: ["17:30-19:00"] },
  equipment: [Equipment.DUMBBELL, Equipment.BARBELL, Equipment.BANDS],
  muscleFocus: [MuscleGroup.CHEST, MuscleGroup.LATS],
  coachStyle: "scientific",
  targetWeightKg: 78,
};

describe("onboarding server action (SaveHealthProfile)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("FITAI_RPC_URL", "http://backend:8080");
    mockSaveHealthProfile.mockReset();
    mockSaveHealthProfile.mockResolvedValue(
      create(SaveHealthProfileResponseSchema, {
        userId: "usr-onboarding-123",
        completionRate: 100,
        aiCoachActivated: true,
        message: "Profile saved successfully",
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends equipment / muscle enums and an injury with region, muscle, side and severity", async () => {
    const { saveOnboardingProfileServerAction } =
      await import("@/features/onboarding/server/onboarding-actions");

    const result = await saveOnboardingProfileServerAction({
      ...BASE,
      injuryStatus: "active",
      injuryRegion: JointRegion.SHOULDER,
      injuryMuscle: MuscleGroup.SHOULDERS,
      injurySide: BodySide.LEFT,
      injurySeverity: InjurySeverity.MODERATE,
      injuryNotes: "Minor impingement",
    });

    expect(mockSaveHealthProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        gender: "MALE",
        goals: ["BUILD_MUSCLE", "FAT_LOSS"],
        preferredWorkoutTimes: ["mon:17:30-19:00", "wed:17:30-19:00", "fri:17:30-19:00"],
        experienceLevel: "INTERMEDIATE",
        coachStyle: "SCIENTIFIC",
        availableEquipment: [Equipment.DUMBBELL, Equipment.BARBELL, Equipment.BANDS],
        preferredMuscleGroups: [MuscleGroup.CHEST, MuscleGroup.LATS],
        injuries: [
          {
            region: JointRegion.SHOULDER,
            muscle: MuscleGroup.SHOULDERS,
            side: BodySide.LEFT,
            severity: InjurySeverity.MODERATE,
            notes: "Minor impingement",
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
    expect(result.aiCoachActivated).toBe(true);
  });

  it("sends no injuries when the user reports none", async () => {
    const { saveOnboardingProfileServerAction } =
      await import("@/features/onboarding/server/onboarding-actions");

    await saveOnboardingProfileServerAction({
      ...BASE,
      injuryStatus: "none",
      injuryRegion: JointRegion.KNEE,
    });

    expect(mockSaveHealthProfile.mock.calls[0][0].injuries).toEqual([]);
  });

  it("forwards the browser time zone so slots are scheduled in it", async () => {
    const { saveOnboardingProfileServerAction } =
      await import("@/features/onboarding/server/onboarding-actions");

    await saveOnboardingProfileServerAction(BASE, "Asia/Ho_Chi_Minh");

    expect(mockSaveHealthProfile.mock.calls[0][0].timezone).toBe("Asia/Ho_Chi_Minh");
  });

  it("recovers gracefully when SaveHealthProfile throws", async () => {
    mockSaveHealthProfile.mockRejectedValue(new Error("Connection reset"));
    const { saveOnboardingProfileServerAction } =
      await import("@/features/onboarding/server/onboarding-actions");

    const result = await saveOnboardingProfileServerAction(BASE);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Connection reset");
  });
});
