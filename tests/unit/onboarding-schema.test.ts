import { describe, expect, it } from "vitest";

import {
  onboardingDefaults,
  onboardingSchema,
  validateAgeBetween,
} from "@/features/onboarding/domain/onboarding-schema";
import {
  Equipment,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

describe("onboarding Zod Schema & Validation Rules", () => {
  const validDefaults = {
    ...onboardingDefaults,
    equipment: [Equipment.BODY_ONLY],
  };
  it("accepts a valid onboarding profile with multi-goals and valid attributes", () => {
    const result = onboardingSchema.safeParse({
      ...validDefaults,
      goals: ["build-muscle", "fat-loss"],
      experienceLevel: "beginner",
      dateOfBirth: "1995-06-20",
      bodyFatPercent: 18.5,
      preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
      equipment: [Equipment.DUMBBELL, Equipment.BARBELL, Equipment.BANDS],
      muscleFocus: [MuscleGroup.CHEST, MuscleGroup.LATS],
    });

    expect(result.success).toBe(true);
  });

  describe("goals validation", () => {
    it("accepts single goal selection", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        goals: ["build-muscle"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts dual goal selection (Build Muscle + Fat Loss)", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        goals: ["build-muscle", "fat-loss"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty goals array", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        goals: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose at least one goal.");
    });
  });

  describe("date of Birth & Age validation (14 to 90 years)", () => {
    it("validates age correctly with helper function", () => {
      expect(validateAgeBetween("2000-01-01", 14, 90)).toBe(true);
      expect(validateAgeBetween("2020-01-01", 14, 90)).toBe(false); // Under 14
      expect(validateAgeBetween("1910-01-01", 14, 90)).toBe(false); // Over 90
      expect(validateAgeBetween("invalid-date", 14, 90)).toBe(false);
    });

    it("accepts a valid birthdate for a 25-year-old", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        dateOfBirth: "1998-05-15",
      });
      expect(result.success).toBe(true);
    });

    it("rejects birthdate for age under 14", () => {
      const currentYear = new Date().getFullYear();
      const underAgeDob = `${currentYear - 10}-01-01`;
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        dateOfBirth: underAgeDob,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Age must be between 14 and 90 years old.");
    });

    it("rejects birthdate for age over 90", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        dateOfBirth: "1910-01-01",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Age must be between 14 and 90 years old.");
    });

    it("rejects invalid date format", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        dateOfBirth: "15/05/1998",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Enter a valid date format (YYYY-MM-DD).");
    });
  });

  describe("body Fat Percent validation (5% to 60%)", () => {
    it("accepts valid body fat percentages like 15.5% or 22%", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        bodyFatPercent: 15.5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects body fat percentage below 5%", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        bodyFatPercent: 3.5,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Body fat must be at least 5%.");
    });

    it("rejects body fat percentage above 60%", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        bodyFatPercent: 65,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Body fat must not exceed 60%.");
    });
  });

  describe("preferred Workout Times validation", () => {
    it("accepts selected Key-Value preferredWorkoutTimes map", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: {
          mon: ["06:00-07:30", "17:30-19:00"],
          wed: ["06:00-07:30"],
          fri: ["06:00-07:30"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts more than six slots: extras become recovery sessions", () => {
      const daily = ["06:00-07:00"];
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: {
          mon: daily,
          tue: daily,
          wed: daily,
          thu: ["06:00-07:00", "18:00-19:00"],
          fri: daily,
          sat: daily,
          sun: daily,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects more than ten weekly slots", () => {
      const twice = ["06:00-07:00", "18:00-19:00"];
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: {
          mon: twice,
          tue: twice,
          wed: twice,
          thu: twice,
          fri: twice,
          sat: twice,
        },
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose at most 10 weekly slots.");
    });

    it("accepts legacy string array workout slots", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty workout time array", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Choose at least one preferred workout time window.",
      );
    });

    it("rejects empty workout time map with no slots", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        preferredWorkoutTimes: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe(
        "Choose at least one preferred workout time window.",
      );
    });
  });

  describe("equipment validation", () => {
    it("accepts every Equipment enum value", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        equipment: [Equipment.BODY_ONLY, Equipment.CABLE, Equipment.OTHER],
      });
      expect(result.success).toBe(true);
    });

    it("rejects free-text equipment and UNSPECIFIED", () => {
      expect(
        onboardingSchema.safeParse({ ...validDefaults, equipment: ["Full Gym"] }).success,
      ).toBe(false);
      expect(
        onboardingSchema.safeParse({ ...validDefaults, equipment: [Equipment.UNSPECIFIED] })
          .success,
      ).toBe(false);
    });

    it("rejects empty equipment array", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        equipment: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose the equipment you can use.");
    });
  });

  describe("injury validation", () => {
    it("requires a region when an injury is reported", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        injuryStatus: "active",
        injuryRegion: JointRegion.UNSPECIFIED,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.path).toEqual(["injuryRegion"]);
    });

    it("accepts an injury with a region and no specific muscle", () => {
      const result = onboardingSchema.safeParse({
        ...validDefaults,
        injuryStatus: "active",
        injuryRegion: JointRegion.KNEE,
        injuryMuscle: MuscleGroup.UNSPECIFIED,
      });
      expect(result.success).toBe(true);
    });

    it("ignores the region when no injury is reported", () => {
      const result = onboardingSchema.safeParse({ ...validDefaults, injuryStatus: "none" });
      expect(result.success).toBe(true);
    });
  });
});
