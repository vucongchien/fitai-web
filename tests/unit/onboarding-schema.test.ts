import { describe, expect, it } from "vitest";

import {
  onboardingDefaults,
  onboardingSchema,
} from "@/features/onboarding/domain/onboarding-schema";

describe("onboardingSchema", () => {
  it("accepts a complete beginner profile with 2 goal options", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      goal: "build-muscle",
      experienceLevel: "beginner",
      availableDays: ["Mon", "Wed", "Fri"],
      equipment: ["Bodyweight", "Dumbbells"],
      muscleFocus: ["Chest", "Back"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid goal outside build-muscle or fat-loss", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      goal: "invalid-goal" as any,
    });

    expect(result.success).toBe(false);
  });

  it("rejects a schedule with no available day", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      availableDays: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Choose at least one training day.");
  });

  it("enforces the six-session business limit", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    });

    expect(result.success).toBe(false);
  });
});
