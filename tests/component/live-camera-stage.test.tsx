import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CameraStage } from "@/features/workout/ui/live/camera-stage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe(CameraStage, () => {
  it("renders with un-mirrored state by default (mirrored=false)", () => {
    const videoRef = createRef<HTMLVideoElement>();
    const { container } = render(
      <CameraStage
        isCustomVideo={false}
        mirrored={false}
        pose={null}
        state="ready"
        videoRef={videoRef}
      />,
    );

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.style.transform).toBe("none");
    expect(video?.getAttribute("data-mirrored")).toBeNull();
  });

  it("toggles mirror state when clicking the mirror toggle button", () => {
    const videoRef = createRef<HTMLVideoElement>();
    const { container } = render(
      <CameraStage
        isCustomVideo={false}
        mirrored={false}
        pose={null}
        state="ready"
        videoRef={videoRef}
      />,
    );

    const video = container.querySelector("video");
    expect(video?.style.transform).toBe("none");

    const mirrorBtn = screen.getByRole("button", { name: /bật lật gương camera/i });
    expect(mirrorBtn).toBeInTheDocument();

    // Click to enable mirror
    fireEvent.click(mirrorBtn);
    expect(video?.style.transform).toBe("scaleX(-1)");
    expect(video?.getAttribute("data-mirrored")).toBe("true");

    // Click to disable mirror
    const disableBtn = screen.getByRole("button", { name: /tắt lật gương camera/i });
    fireEvent.click(disableBtn);
    expect(video?.style.transform).toBe("none");
    expect(video?.getAttribute("data-mirrored")).toBeNull();
  });

  it("hides mirror button and disables transform when tracking from custom video", () => {
    const videoRef = createRef<HTMLVideoElement>();
    const { container } = render(
      <CameraStage
        customVideoSrc="blob:http://localhost/test.mp4"
        isCustomVideo={true}
        mirrored={true}
        pose={null}
        state="ready"
        videoRef={videoRef}
      />,
    );

    const video = container.querySelector("video");
    expect(video?.style.transform).toBe("none");
    expect(screen.queryByRole("button", { name: /lật gương camera/i })).not.toBeInTheDocument();
    expect(screen.getByText("Tracking from Video")).toBeInTheDocument();
  });

  it("calls onFlip when clicking switch camera button", () => {
    const videoRef = createRef<HTMLVideoElement>();
    const onFlip = vi.fn();
    render(
      <CameraStage
        isCustomVideo={false}
        onFlip={onFlip}
        pose={null}
        state="ready"
        videoRef={videoRef}
      />,
    );

    const flipBtn = screen.getByRole("button", { name: "Switch camera" });
    fireEvent.click(flipBtn);
    expect(onFlip).toHaveBeenCalledTimes(1);
  });
});
