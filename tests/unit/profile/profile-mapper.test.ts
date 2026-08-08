import { describe, expect, it } from "vitest";
import {
  calculateBMI,
  calculateOneRepMax,
  mapRawDataToProfileViewModel,
  translateCoachStyle,
  translateEquipment,
  translateExperienceLevel,
  translateGender,
  translateGoal,
  translateMuscleGroup,
} from "../../../src/features/profile/model/profile.mapper";

describe("profile Mapper", () => {
  describe(calculateBMI, () => {
    it("calculates BMI accurately for 175cm height and 68.5kg weight", () => {
      const result = calculateBMI(68.5, 175);
      expect(result.bmi).toBe(22.4);
      expect(result.category).toBe("Normal");
    });

    it("handles zero/missing values safely", () => {
      const result = calculateBMI(0, 175);
      expect(result.bmi).toBe(0);
      expect(result.category).toBe("No data");
    });
  });

  describe(calculateOneRepMax, () => {
    it("calculates 1RM using Epley formula", () => {
      const result = calculateOneRepMax(100, 10);
      expect(result).toBe(133);
    });

    it("returns exact weight when reps <= 1", () => {
      expect(calculateOneRepMax(140, 1)).toBe(140);
    });
  });

  describe("translations", () => {
    it("translates experience level to English", () => {
      expect(translateExperienceLevel("BEGINNER")).toBe("Beginner");
      expect(translateExperienceLevel("INTERMEDIATE")).toBe("Intermediate");
      expect(translateExperienceLevel("ADVANCED")).toBe("Advanced");
    });

    it("translates goals to English", () => {
      expect(translateGoal("HYPERTROPHY")).toBe("Build Muscle");
      expect(translateGoal("BUILD_MUSCLE")).toBe("Build Muscle");
      expect(translateGoal("FAT_LOSS")).toBe("Lose Fat");
      expect(translateGoal("LOSE_FAT")).toBe("Lose Fat");
      expect(translateGoal("STRENGTH")).toBe("Strength");
      expect(translateGoal("ENDURANCE")).toBe("Endurance");
    });

    it("translates muscle groups to English", () => {
      expect(translateMuscleGroup("CHEST")).toBe("Chest");
      expect(translateMuscleGroup("BACK")).toBe("Back");
      expect(translateMuscleGroup("LEGS")).toBe("Legs");
      expect(translateMuscleGroup("SHOULDERS")).toBe("Shoulders");
      expect(translateMuscleGroup("ARMS")).toBe("Arms");
      expect(translateMuscleGroup("CORE")).toBe("Core");
      expect(translateMuscleGroup("GLUTES")).toBe("Glutes");
      expect(translateMuscleGroup("FULL_BODY")).toBe("Full Body");
    });

    it("translates equipment to English", () => {
      expect(translateEquipment("FULL_GYM")).toBe("Full Gym");
      expect(translateEquipment("DUMBBELL_ONLY")).toBe("Dumbbells");
      expect(translateEquipment("DUMBBELLS")).toBe("Dumbbells");
      expect(translateEquipment("BARBELL")).toBe("Barbell");
      expect(translateEquipment("BODYWEIGHT")).toBe("Bodyweight");
      expect(translateEquipment("RESISTANCE_BAND")).toBe("Resistance Band");
      expect(translateEquipment("KETTLEBELL")).toBe("Kettlebell");
      expect(translateEquipment("MACHINE")).toBe("Machine");
    });

    it("translates coach style to English", () => {
      expect(translateCoachStyle("MOTIVATIONAL")).toBe("Motivational");
      expect(translateCoachStyle("STRICT")).toBe("Strict");
      expect(translateCoachStyle("SCIENTIFIC")).toBe("Scientific");
    });

    it("translates gender to English (Male, Female, Other)", () => {
      expect(translateGender("MALE")).toBe("Male");
      expect(translateGender("FEMALE")).toBe("Female");
      expect(translateGender("OTHER")).toBe("Other");
      expect(translateGender("Male")).toBe("Male");
      expect(translateGender("Female")).toBe("Female");
      expect(translateGender("Other")).toBe("Other");
    });
  });

  describe(mapRawDataToProfileViewModel, () => {
    it("converts empty data into safe default ViewModel", () => {
      const vm = mapRawDataToProfileViewModel({});
      expect(vm.user.name).toBe("Athlete");
      expect(vm.user.level).toBe(1);
      expect(vm.user.dateOfBirth).toBe("");
      expect(vm.user.gender).toBe("Not set");
      expect(vm.highlights.currentWeightKg).toBe(0);
      expect(vm.bestPr).toBeNull();
      expect(vm.stats.totalWorkouts).toBe(0);
      expect(vm.settings.coachStyle).toBe("Motivational");
    });

    it("converts specific protobuf raw data with exact DOB and Other gender", () => {
      const vm = mapRawDataToProfileViewModel({
        user: { name: "Taylor Swift", level: 12 },
        profileProto: {
          weightKg: 58,
          heightCm: 178,
          targetWeightKg: 56,
          bodyFatPercent: 15,
          experienceLevel: "ADVANCED",
          goals: ["STRENGTH", "ENDURANCE"],
          preferredMuscleGroups: ["LEGS", "GLUTES", "CORE"],
          availableEquipment: ["FULL_GYM", "KETTLEBELL"],
          dateOfBirth: "1989-12-13",
          gender: "OTHER",
          coachStyle: "SCIENTIFIC",
        },
        prListProto: [
          {
            exerciseId: "squat",
            exerciseName: "Barbell Back Squat",
            weight: 95,
            reps: 3,
            oneRepMax: 104,
          },
        ],
        statsProto: { totalWorkouts: 85, activeStreakDays: 20, totalCaloriesKcal: 32_000 },
      });

      expect(vm.user.name).toBe("Taylor Swift");
      expect(vm.user.level).toBe(12);
      expect(vm.user.experienceLevel).toBe("Advanced");
      expect(vm.user.dateOfBirth).toBe("1989-12-13");
      expect(vm.user.gender).toBe("Other");
      expect(vm.settings.coachStyle).toBe("Scientific");
      expect(vm.settings.availableEquipment).toContain("Full Gym");
      expect(vm.settings.availableEquipment).toContain("Kettlebell");
      expect(vm.healthMetrics.goals).toStrictEqual(["Strength", "Endurance"]);
      expect(vm.healthMetrics.preferredMuscleGroups).toStrictEqual(["Legs", "Glutes", "Core"]);
      expect(vm.highlights.currentWeightKg).toBe(58);
      expect(vm.bestPr?.exerciseName).toBe("Barbell Back Squat");
      expect(vm.bestPr?.weightKg).toBe(95);
      expect(vm.stats.totalWorkouts).toBe(85);
    });
  });
});
