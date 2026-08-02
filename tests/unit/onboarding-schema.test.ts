import { describe, expect, it } from "vitest";

import {
  onboardingDefaults,
  onboardingSchema,
} from "@/features/onboarding/domain/onboarding-schema";

describe("onboardingSchema", () => {
  it("accepts a complete beginner profile", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      availableDays: ["Mon", "Wed", "Fri"],
      equipment: ["Bodyweight", "Dumbbells"],
      muscleFocus: ["Full body"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects a schedule with no available day", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      availableDays: [],
      equipment: ["Bodyweight"],
      muscleFocus: ["Full body"],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Choose at least one training day.");
  });

  it("enforces the six-session business limit", () => {
    const result = onboardingSchema.safeParse({
      ...onboardingDefaults,
      availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      equipment: ["Bodyweight"],
      muscleFocus: ["Full body"],
    });

    expect(result.success).toBe(false);
  });
});
