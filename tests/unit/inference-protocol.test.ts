import { describe, expect, it } from 'vitest';
import { isInferenceResponse } from "@/features/workout/model/inference-protocol";

describe(isInferenceResponse, () => {
  it("accepts every response variant the worker sends", () => {
    expect(isInferenceResponse({ type: "ready" })).toBe(true);
    expect(isInferenceResponse({ message: "no webgpu", type: "init-failed" })).toBe(true);
    expect(
      isInferenceResponse({ event: { pose: null, type: "pose" }, type: "event" }),
    ).toBe(true);
    expect(isInferenceResponse({ type: "frame-done" })).toBe(true);
  });

  it("rejects anything that is not a tagged response object", () => {
    expect(isInferenceResponse(null)).toBe(false);
    expect(isInferenceResponse("ready")).toBe(false);
    expect(isInferenceResponse({})).toBe(false);
    expect(isInferenceResponse({ type: "something-else" })).toBe(false);
  });
});
