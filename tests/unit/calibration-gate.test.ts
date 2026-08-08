import { describe, expect, it } from 'vitest';
import { describe, expect, it } from '@jest/globals';
import { shouldCalibrate } from "@/features/workout/domain/calibration-gate";
import type { LiveStatus } from "@/features/workout/model/use-live-session";

const base = {
  cameraBranch: true,
  cameraOn: true,
  cameraReady: false,
  status: "ready" as LiveStatus,
};

describe(shouldCalibrate, () => {
  it("never shows for an exercise without the camera branch", () => {
    expect(shouldCalibrate({ ...base, cameraBranch: false })).toBe(false);
  });

  it("shows before an AI set while the engine is not ready", () => {
    expect(shouldCalibrate(base)).toBe(true);
  });

  it("never shows over a running set, whatever the motion engine reports", () => {
    // The camera lifecycle effect re-prepares the engine on `ready → working`,
    // Which drops `cameraReady` back to false mid-set. The overlay must not
    // Reappear over Done, +10s and a rep count in progress.
    expect(shouldCalibrate({ ...base, status: "working" })).toBe(false);
    expect(shouldCalibrate({ ...base, status: "resting" })).toBe(false);
    expect(shouldCalibrate({ ...base, status: "complete" })).toBe(false);
  });

  it("never shows once the user has switched the preview off", () => {
    // No video to line up in, so an overlay asking the user to line up would be
    // A dead end with no way back to the camera toggle underneath.
    expect(shouldCalibrate({ ...base, cameraOn: false })).toBe(false);
  });

  it("closes as soon as the framing check passes", () => {
    expect(shouldCalibrate({ ...base, cameraReady: true })).toBe(false);
  });
});
