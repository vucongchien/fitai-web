import { Code, ConnectError } from "@connectrpc/connect";
import { describe, expect, it } from "vitest";

import {
  describeExerciseError,
  getAiSupportState,
  validateMotionSlug,
} from "@/features/admin/domain/exercise-ai-support";

describe("admin AI support rule", () => {
  it("does not offer AI configuration without a motion slug", () => {
    const state = getAiSupportState({ hasAiSupported: false, motionSlug: "  " });
    expect(state.canConfigure).toBe(false);
    expect(state.message).toMatch(/motion slug/iu);
  });

  it("offers AI configuration once a motion slug is saved", () => {
    const state = getAiSupportState({ hasAiSupported: false, motionSlug: "squat" });
    expect(state.canConfigure).toBe(true);
    expect(state.message).toContain("squat");
  });

  it("reports AI as on when supported", () => {
    const state = getAiSupportState({ hasAiSupported: true, motionSlug: "plank" });
    expect(state).toEqual({
      canConfigure: true,
      message: 'AI form tracking is on (motion "plank").',
    });
  });

  it("blocks clearing the motion slug while AI is on", () => {
    expect(validateMotionSlug(true, "")).toMatch(/required/iu);
    expect(validateMotionSlug(true, "squat")).toBeNull();
    expect(validateMotionSlug(false, "")).toBeNull();
  });

  it.each([
    [Code.AlreadyExists, "An exercise with this slug already exists. Use a different name."],
    [Code.FailedPrecondition, "AI form tracking requires a motion slug."],
    [Code.NotFound, "Exercise not found."],
    [Code.Unavailable, "Could not save the exercise. Please try again."],
  ])("maps Connect code %s to a clear message", (code, message) => {
    expect(describeExerciseError(new ConnectError("x", code))).toBe(message);
  });

  it("surfaces the backend reason for InvalidArgument", () => {
    expect(describeExerciseError(new ConnectError("level is required", Code.InvalidArgument))).toBe(
      "level is required",
    );
  });
});
