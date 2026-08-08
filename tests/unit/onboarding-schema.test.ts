import { describe, expect, it } from '@jest/globals';


import {
  onboardingDefaults,
  onboardingSchema,
  validateAgeBetween,
} from "@/features/onboarding/domain/onboarding-schema";

describe("onboarding Zod Schema & Validation Rules", () => {
  it("accepts a valid onboarding profile with multi-goals and valid attributes", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      goals: ["build-muscle", "fat-loss"],
      experienceLevel: "beginner",
      dateOfBirth: "1995-06-20",
      bodyFatPercent: 18.5,
      preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
      equipment: ["Full Gym", "Dumbbells", "Barbell", "Bodyweight", "Resistance Band"],
      muscleFocus: ["Chest", "Back"],
    });

    expect(result.success).toBe(true);
  });

  describe("goals validation", () => {
    it("accepts single goal selection", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        goals: ["build-muscle"],
      });
      expect(result.success).toBe(true);
    });

    it("accepts dual goal selection (Build Muscle + Fat Loss)", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        goals: ["build-muscle", "fat-loss"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty goals array", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
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
        ...onboardingDefaults,
        dateOfBirth: "1998-05-15",
      });
      expect(result.success).toBe(true);
    });

    it("rejects birthdate for age under 14", () => {
      const currentYear = new Date().getFullYear();
      const underAgeDob = `${currentYear - 10}-01-01`;
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        dateOfBirth: underAgeDob,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Age must be between 14 and 90 years old.");
    });

    it("rejects birthdate for age over 90", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        dateOfBirth: "1910-01-01",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Age must be between 14 and 90 years old.");
    });

    it("rejects invalid date format", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        dateOfBirth: "15/05/1998",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Enter a valid date format (YYYY-MM-DD).");
    });
  });

  describe("body Fat Percent validation (5% to 60%)", () => {
    it("accepts valid body fat percentages like 15.5% or 22%", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        bodyFatPercent: 15.5,
      });
      expect(result.success).toBe(true);
    });

    it("rejects body fat percentage below 5%", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        bodyFatPercent: 3.5,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Body fat must be at least 5%.");
    });

    it("rejects body fat percentage above 60%", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        bodyFatPercent: 65,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Body fat must not exceed 60%.");
    });
  });

  describe("preferred Workout Times validation", () => {
    it("accepts selected Key-Value preferredWorkoutTimes map", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        preferredWorkoutTimes: {
          mon: ["06:00-07:30", "17:30-19:00"],
          wed: ["06:00-07:30"],
          fri: ["06:00-07:30"],
        },
      });
      expect(result.success).toBe(true);
    });

    it("accepts legacy string array workout slots", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        preferredWorkoutTimes: ["Mon PM", "Wed PM", "Fri PM"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty workout time array", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        preferredWorkoutTimes: [],
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose at least one preferred workout time window.");
    });

    it("rejects empty workout time map with no slots", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        preferredWorkoutTimes: {},
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Choose at least one preferred workout time window.");
    });
  });

  describe("equipment standardization", () => {
    it("accepts standardized equipment enum values matching profile modal", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        equipment: ["Full Gym", "Dumbbells", "Barbell", "Bodyweight", "Resistance Band"],
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-standard equipment name", () => {
      const result = onboardingSchema.safeParse({
        ...onboardingDefaults,
        equipment: ["Kettlebell Only" as any],
      });
      expect(result.success).toBe(false);
    });
  });
});
