import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Pose } from "@/features/workout/domain/pose-metrics";
import { KEYPOINT_NAMES } from "@/features/workout/domain/pose-metrics";
import { PoseOverlay } from "@/features/workout/ui/live/pose-overlay";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function createDummyPose(): Pose {
  return {
    keypoints: KEYPOINT_NAMES.map((name, index) => ({
      score: 0.9,
      x: 100 + index * 10,
      y: 200 + index * 5,
    })),
    score: 0.9,
    sourceHeight: 720,
    sourceWidth: 1280,
  };
}

describe(PoseOverlay, () => {
  it("renders canvas element properly", () => {
    const { container } = render(
      <PoseOverlay
        alert={false}
        mirrored={false}
        pose={null}
        sourceHeight={720}
        sourceWidth={1280}
      />,
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("handles drawing keypoints when pose is supplied in non-mirrored mode", () => {
    const pose = createDummyPose();
    const { container } = render(
      <PoseOverlay
        alert={false}
        mirrored={false}
        pose={pose}
        sourceHeight={720}
        sourceWidth={1280}
      />,
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("handles drawing keypoints when pose is supplied in mirrored mode", () => {
    const pose = createDummyPose();
    const { container } = render(
      <PoseOverlay
        alert={true}
        mirrored={true}
        pose={pose}
        sourceHeight={720}
        sourceWidth={1280}
      />,
    );

    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });
});
