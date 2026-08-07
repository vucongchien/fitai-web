

import { isInferenceResponse } from "@/features/workout/model/inference-protocol";

describe(isInferenceResponse, () => {
  it("accepts every response variant the worker sends", () => {
    expect(isInferenceResponse({ type: "ready" })).toBeTruthy();
    expect(isInferenceResponse({ message: "no webgpu", type: "init-failed" })).toBeTruthy();
    expect(isInferenceResponse({ event: { pose: null, type: "pose" }, type: "event" })).toBeTruthy();
    expect(isInferenceResponse({ type: "frame-done" })).toBeTruthy();
  });

  it("rejects anything that is not a tagged response object", () => {
    expect(isInferenceResponse(null)).toBeFalsy();
    expect(isInferenceResponse("ready")).toBeFalsy();
    expect(isInferenceResponse({})).toBeFalsy();
    expect(isInferenceResponse({ type: "something-else" })).toBeFalsy();
  });
});
