import { describe, expect, it, vi } from "vitest";

import {
  mapCoachStyleToEnum,
  mapEquipmentToEnum,
  mapGoalToEnum,
  updateProfileServerAction,
} from "../../../src/features/profile/server/profile-actions";

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
    it("maps goals to protobuf enums", async () => {
      expect(await mapGoalToEnum("Build Muscle")).toBe("BUILD_MUSCLE");
      expect(await mapGoalToEnum("Lose Fat")).toBe("FAT_LOSS");
      expect(await mapGoalToEnum("FAT_LOSS")).toBe("FAT_LOSS");
      expect(await mapGoalToEnum("Strength")).toBe("STRENGTH");
      expect(await mapGoalToEnum("Endurance")).toBe("ENDURANCE");
    });

    it("maps equipment to protobuf enums", async () => {
      expect(await mapEquipmentToEnum("Full Gym")).toBe("FULL_GYM");
      expect(await mapEquipmentToEnum("Dumbbells")).toBe("DUMBBELL_ONLY");
      expect(await mapEquipmentToEnum("Barbell")).toBe("BARBELL");
      expect(await mapEquipmentToEnum("Bodyweight")).toBe("BODYWEIGHT");
      expect(await mapEquipmentToEnum("Resistance Band")).toBe("RESISTANCE_BAND");
      expect(await mapEquipmentToEnum("Kettlebell")).toBe("KETTLEBELL");
      expect(await mapEquipmentToEnum("Machine")).toBe("MACHINE");
    });

    it("maps coach style to protobuf enums", async () => {
      expect(await mapCoachStyleToEnum("Motivational")).toBe("MOTIVATIONAL");
      expect(await mapCoachStyleToEnum("Strict")).toBe("STRICT");
      expect(await mapCoachStyleToEnum("Scientific")).toBe("SCIENTIFIC");
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
          targetWeightKg: 74.0,
          bodyFatPercent: 14.5,
        },
        healthMetrics: {
          heightCm: 182,
          bmi: 23.7,
          bmiCategory: "Normal",
          targetBodyFatPercent: 12.0,
          goals: ["Build Muscle", "Strength"],
          preferredMuscleGroups: ["Chest", "Back", "Legs"],
        },
        settings: {
          availableEquipment: ["Full Gym", "Barbell"],
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
          availableEquipment: ["FULL_GYM", "BARBELL"],
          preferredMuscleGroups: ["CHEST", "BACK", "LEGS"],
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
});
