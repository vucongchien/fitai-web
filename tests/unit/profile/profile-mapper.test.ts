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

describe("Profile Mapper", () => {
  describe("calculateBMI", () => {
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

  describe("calculateOneRepMax", () => {
    it("calculates 1RM using Epley formula", () => {
      const result = calculateOneRepMax(100, 10);
      expect(result).toBe(133);
    });

    it("returns exact weight when reps <= 1", () => {
      expect(calculateOneRepMax(140, 1)).toBe(140);
    });
  });

  describe("Translations", () => {
    it("translates experience level to English", () => {
      expect(translateExperienceLevel("BEGINNER")).toBe("Beginner");
      expect(translateExperienceLevel("INTERMEDIATE")).toBe("Intermediate");
      expect(translateExperienceLevel("ADVANCED")).toBe("Advanced");
    });

    it("translates goals to English", () => {
      expect(translateGoal("HYPERTROPHY")).toBe("Build Muscle");
      expect(translateGoal("FAT_LOSS")).toBe("Lose Fat");
    });

    it("translates muscle groups to English", () => {
      expect(translateMuscleGroup("CHEST")).toBe("Chest");
      expect(translateMuscleGroup("BACK")).toBe("Back");
      expect(translateMuscleGroup("LEGS")).toBe("Legs");
    });

    it("translates equipment to English", () => {
      expect(translateEquipment("FULL_GYM")).toBe("Full Gym");
      expect(translateEquipment("DUMBBELL_ONLY")).toBe("Dumbbells");
    });

    it("translates coach style to English", () => {
      expect(translateCoachStyle("MOTIVATIONAL")).toBe("Motivational");
      expect(translateCoachStyle("STRICT")).toBe("Strict");
    });

    it("translates gender to English", () => {
      expect(translateGender("MALE")).toBe("Male");
      expect(translateGender("FEMALE")).toBe("Female");
    });
  });

  describe("mapRawDataToProfileViewModel", () => {
    it("converts empty data into safe default ViewModel", () => {
      const vm = mapRawDataToProfileViewModel({});
      expect(vm.user.name).toBe("Emma Nguyen");
      expect(vm.user.level).toBe(10);
      expect(vm.user.dateOfBirth).toBe("1998-05-15");
      expect(vm.user.gender).toBe("Female");
      expect(vm.highlights.currentWeightKg).toBe(68.5);
      expect(vm.bestPr?.weightKg).toBe(140);
      expect(vm.stats.totalWorkouts).toBe(48);
      expect(vm.settings.coachStyle).toBe("Motivational");
    });

    it("converts specific protobuf raw data", () => {
      const vm = mapRawDataToProfileViewModel({
        user: { name: "Alexander", level: 15 },
        profileProto: {
          weightKg: 75,
          heightCm: 180,
          targetWeightKg: 70,
          bodyFatPercent: 16,
          experienceLevel: "ADVANCED",
          goals: ["STRENGTH"],
          dateOfBirth: "1995-10-20",
          gender: "MALE",
          coachStyle: "STRICT",
        },
        prListProto: [
          { exerciseId: "bench", exerciseName: "Bench Press", weight: 100, reps: 5, oneRepMax: 116 },
        ],
        statsProto: { totalWorkouts: 120, activeStreakDays: 30, totalCaloriesKcal: 45000 },
      });

      expect(vm.user.name).toBe("Alexander");
      expect(vm.user.level).toBe(15);
      expect(vm.user.experienceLevel).toBe("Advanced");
      expect(vm.user.dateOfBirth).toBe("1995-10-20");
      expect(vm.user.gender).toBe("Male");
      expect(vm.settings.coachStyle).toBe("Strict");
      expect(vm.highlights.currentWeightKg).toBe(75);
      expect(vm.bestPr?.exerciseName).toBe("Bench Press");
      expect(vm.bestPr?.weightKg).toBe(100);
      expect(vm.stats.totalWorkouts).toBe(120);
    });
  });
});
