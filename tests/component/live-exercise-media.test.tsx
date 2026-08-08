import { afterEach, describe, expect, it } from 'vitest';
import { afterEach, describe, expect, it, vi } from '@jest/globals';
import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

import type { LiveExercise } from "@/features/workout/model/live-session.types";
import { ExerciseMedia } from "@/features/workout/ui/live/exercise-media";

type ExerciseMediaProps = ComponentProps<typeof ExerciseMedia>;
/** `useReducedMotion` only ever subscribes to the "change" event. */
type MediaQueryListen = (type: "change", listener: (event: MediaQueryListEvent) => void) => void;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function makeExercise(overrides: Partial<LiveExercise> = {}): LiveExercise {
  return {
    commonMistakes: [],
    durationSeconds: 30,
    equipmentId: "eq-bodyweight",
    exerciseId: "ex-plank",
    formCues: [],
    hasAiSupported: true,
    isWeighted: false,
    name: "Plank Hold",
    notes: "",
    phase: "main",
    restExerciseSec: 45,
    restSetSec: 30,
    targetReps: 0,
    targetRpe: 6,
    targetSets: 3,
    targetWeightKg: 0,
    ...overrides,
  };
}

describe(ExerciseMedia, () => {
  it("plays the demo video when the exercise has one", () => {
    const { container } = render(
      <ExerciseMedia exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })} />,
    );

    const video = container.querySelector("video");
    expect(video).toHaveAttribute("src", "/demo/plank.mp4");
  });

  it("falls back to the thumbnail when there is no video", () => {
    render(
      <ExerciseMedia
        exercise={makeExercise({ thumbnailUrl: "/demo/plank.jpg", videoUrl: undefined })}
      />,
    );

    expect(screen.getByRole("img", { name: "Plank Hold" })).toHaveAttribute(
      "src",
      "/demo/plank.jpg",
    );
  });

  it("falls back to the exercise initial when there is neither video nor thumbnail", () => {
    render(<ExerciseMedia exercise={makeExercise()} />);

    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("shows the camera button for AI-supported exercises", () => {
    render(
      <ExerciseMedia
        exercise={makeExercise()}
        onOpenCamera={vi.fn<NonNullable<ExerciseMediaProps["onOpenCamera"]>>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Open AI camera" })).toBeInTheDocument();
  });

  it("hides the camera button when the exercise has no AI support", () => {
    render(
      <ExerciseMedia
        exercise={makeExercise({ hasAiSupported: false })}
        onOpenCamera={vi.fn<NonNullable<ExerciseMediaProps["onOpenCamera"]>>()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });

  it("hides the camera button when no handler is supplied", () => {
    render(<ExerciseMedia exercise={makeExercise()} />);

    expect(screen.queryByRole("button", { name: "Open AI camera" })).not.toBeInTheDocument();
  });

  it("renders children instead of the poster when the camera is live", () => {
    render(
      <ExerciseMedia cameraActive exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })}>
        <div data-testid="camera" />
      </ExerciseMedia>,
    );

    expect(screen.getByTestId("camera")).toBeInTheDocument();
  });

  it("pauses the demo clip instead of looping it when the OS asks for reduced motion", () => {
    const pause = vi.fn<HTMLMediaElement["pause"]>();
    const play = vi.fn<HTMLMediaElement["play"]>().mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
    vi.stubGlobal(
      "matchMedia",
      vi.fn<Window["matchMedia"]>().mockReturnValue({
        matches: true,
        addEventListener: vi.fn<MediaQueryListen>(),
        removeEventListener: vi.fn<MediaQueryListen>(),
      } as unknown as MediaQueryList),
    );

    render(<ExerciseMedia exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })} />);

    expect(pause).toHaveBeenCalledWith();
    expect(play).not.toHaveBeenCalled();
  });

  it("plays the demo clip when motion is fine", () => {
    const play = vi.fn<HTMLMediaElement["play"]>().mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
    vi.stubGlobal(
      "matchMedia",
      vi.fn<Window["matchMedia"]>().mockReturnValue({
        matches: false,
        addEventListener: vi.fn<MediaQueryListen>(),
        removeEventListener: vi.fn<MediaQueryListen>(),
      } as unknown as MediaQueryList),
    );

    render(<ExerciseMedia exercise={makeExercise({ videoUrl: "/demo/plank.mp4" })} />);

    expect(play).toHaveBeenCalledWith();
  });
});
