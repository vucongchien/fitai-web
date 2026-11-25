import { describe, expect, it, vi } from "vitest";

import {
  BodySide,
  Equipment,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

import {
  mapCoachStyleToEnum,
  mapGoalToEnum,
} from "../../../src/features/profile/model/profile.mapper";
import { updateProfileServerAction } from "../../../src/features/profile/server/profile-actions";

vi.mock("@/shared/auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

const mockUpdateProfile = vi.fn();

vi.mock("@connectrpc/connect", () => ({
  createClient: vi.fn(() => ({
    updateProfile: mockUpdateProfile,
  })),
}));

vi.mock("@/shared/api/server/transport", () => ({
  createServerTransport: vi.fn(() => ({})),
}));

describe("profile Actions", () => {
  describe("enum Mappers", () => {
    it("maps goals to protobuf enums", () => {
      expect(mapGoalToEnum("Build Muscle")).toBe("BUILD_MUSCLE");
      expect(mapGoalToEnum("Lose Fat")).toBe("FAT_LOSS");
      expect(mapGoalToEnum("FAT_LOSS")).toBe("FAT_LOSS");
      expect(mapGoalToEnum("Strength")).toBe("STRENGTH");
      expect(mapGoalToEnum("Endurance")).toBe("ENDURANCE");
    });

    it("maps coach style to protobuf enums", () => {
      expect(mapCoachStyleToEnum("Motivational")).toBe("MOTIVATIONAL");
      expect(mapCoachStyleToEnum("Strict")).toBe("STRICT");
      expect(mapCoachStyleToEnum("Scientific")).toBe("SCIENTIFIC");
    });
  });

  describe(updateProfileServerAction, () => {
    it("serializes payload and calls gRPC client.updateProfile", async () => {
      mockUpdateProfile.mockResolvedValueOnce({
        success: true,
        message: "Profile updated successfully",
      });

      const payload = {
        user: {
          id: "usr-123",
          name: "Test User",
          avatarUrl: "",
          level: 5,
          experienceLevel: "Advanced",
          dateOfBirth: "1994-06-15",
          gender: "Male",
        },
        highlights: {
          currentWeightKg: 78.5,
          targetWeightKg: 74,
          bodyFatPercent: 14.5,
        },
        healthMetrics: {
          heightCm: 182,
          bmi: 23.7,
          bmiCategory: "Normal",
          targetBodyFatPercent: 12,
          goals: ["Build Muscle", "Strength"],
          preferredMuscleGroups: [MuscleGroup.CHEST, MuscleGroup.LATS, MuscleGroup.QUADRICEPS],
        },
        settings: {
          availableEquipment: [Equipment.MACHINE, Equipment.BARBELL],
          preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
          coachStyle: "Strict",
        },
      };

      const result = await updateProfileServerAction(payload);

      expect(result.success).toBe(true);
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          weightKg: 78.5,
          heightCm: 182,
          dateOfBirth: "1994-06-15",
          gender: "MALE",
          goals: ["BUILD_MUSCLE", "STRENGTH"],
          experienceLevel: "ADVANCED",
          availableEquipment: [Equipment.MACHINE, Equipment.BARBELL],
          preferredMuscleGroups: [MuscleGroup.CHEST, MuscleGroup.LATS, MuscleGroup.QUADRICEPS],
          preferredWorkoutTimes: ["mon:17:30-19:00", "wed:17:30-19:00", "fri:17:30-19:00"],
          coachStyle: "STRICT",
        }),
      );
    });

    it("handles gRPC errors gracefully and returns failure message", async () => {
      mockUpdateProfile.mockRejectedValueOnce(new Error("gRPC network timeout"));

      const result = await updateProfileServerAction({
        highlights: { currentWeightKg: 70, targetWeightKg: 68, bodyFatPercent: 15 },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("gRPC network timeout");
    });
  });

  describe("reportInjuryServerAction & recoverInjuryServerAction", () => {
    it("reports injury with formatted muscle group and default notes", async () => {
      const mockReportInjury = vi.fn().mockResolvedValue({
        success: true,
        injuryId: "inj-test-123",
        message: "Injury reported",
      });

      const { createClient } = await import("@connectrpc/connect");
      vi.mocked(createClient).mockReturnValueOnce({
        reportInjury: mockReportInjury,
      } as any);

      const { reportInjuryServerAction } =
        await import("../../../src/features/profile/server/profile-actions");

      const result = await reportInjuryServerAction({
        region: JointRegion.LOWER_BACK,
        muscle: MuscleGroup.UNSPECIFIED,
        side: BodySide.BOTH,
        severity: InjurySeverity.MODERATE,
        notes: "",
      });

      expect(result.success).toBe(true);
      expect(result.injuryId).toBe("inj-test-123");
      expect(mockReportInjury).toHaveBeenCalledWith({
        region: JointRegion.LOWER_BACK,
        muscle: MuscleGroup.UNSPECIFIED,
        side: BodySide.BOTH,
        severity: InjurySeverity.MODERATE,
        notes: "",
      });
    });

    it("does not call the backend without a region", async () => {
      const { createClient } = await import("@connectrpc/connect");
      const { reportInjuryServerAction } =
        await import("../../../src/features/profile/server/profile-actions");
      vi.mocked(createClient).mockClear();

      const result = await reportInjuryServerAction({
        region: JointRegion.UNSPECIFIED,
        muscle: MuscleGroup.QUADRICEPS,
        side: BodySide.BOTH,
        severity: InjurySeverity.MILD,
        notes: "",
      });

      expect(result).toEqual({ success: false, message: "Choose the painful area first." });
      expect(createClient).not.toHaveBeenCalled();
    });

    it("recovers injury by injuryId", async () => {
      const mockRecoverInjury = vi.fn().mockResolvedValue({
        success: true,
        message: "Injury marked as recovered",
      });

      const { createClient } = await import("@connectrpc/connect");
      vi.mocked(createClient).mockReturnValueOnce({
        recoverInjury: mockRecoverInjury,
      } as any);

      const { recoverInjuryServerAction } =
        await import("../../../src/features/profile/server/profile-actions");

      const result = await recoverInjuryServerAction("inj-test-123");

      expect(result.success).toBe(true);
      expect(mockRecoverInjury).toHaveBeenCalledWith({
        injuryId: "inj-test-123",
      });
    });
  });
});
