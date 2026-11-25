import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { LiveSessionPlan } from "@/features/workout/model/live-session.types";
import {
  BodySide,
  JointRegion,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

const mocks = vi.hoisted(() => ({
  abortWorkoutSession: vi.fn(),
  reportPainInjury: vi.fn(),
  startAIAdjustment: vi.fn(),
  replace: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
}));
vi.mock("@/features/workout/server/workout-actions", () => ({
  abortWorkoutSession: mocks.abortWorkoutSession,
  completeWorkoutSession: vi.fn(),
  logWorkoutSet: vi.fn(),
  syncWorkoutLogs: vi.fn(),
}));
vi.mock("@/features/roadmap/model/ai-adjustment-store", () => ({
  startAIAdjustment: mocks.startAIAdjustment,
}));
vi.mock("@/features/workout/model/report-pain-injury", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/workout/model/report-pain-injury")>()),
  reportPainInjury: mocks.reportPainInjury,
}));
vi.mock("@/shared/ui/toast", () => ({
  toast: { error: mocks.toastError, success: vi.fn() },
}));

import { useWorkoutSessionSync } from "@/features/workout/model/use-workout-session-sync";

function renderSync() {
  const deps = {
    audio: { stopAll: vi.fn() },
    camera: { stop: vi.fn() },
    cameraBranch: false,
    elapsedSecRef: { current: 0 },
    exercise: null,
    motion: { dispose: vi.fn() },
    plan: { sessionId: "ses-1" } as LiveSessionPlan,
    playCueByCode: vi.fn(),
    session: { step: null, loggedSets: [], actions: { clearDraft: vi.fn() } },
    spec: null,
  } as unknown as Parameters<typeof useWorkoutSessionSync>[0];
  return renderHook(() => useWorkoutSessionSync(deps)).result;
}

afterEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
});

describe("abortSession for pain", () => {
  it("reports the injury only after the abort succeeded and lets it start the adjustment", async () => {
    mocks.abortWorkoutSession.mockResolvedValue(undefined);
    mocks.reportPainInjury.mockResolvedValue("saved");
    const result = renderSync();

    await act(() =>
      result.current.abortSession("pain", "", {
        note: "",
        region: JointRegion.KNEE,
        side: BodySide.LEFT,
      }),
    );

    expect(mocks.abortWorkoutSession).toHaveBeenCalledWith("ses-1", "pain", "");
    expect(mocks.reportPainInjury).toHaveBeenCalledOnce();
    expect(mocks.abortWorkoutSession.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.reportPainInjury.mock.invocationCallOrder[0],
    );
    expect(mocks.startAIAdjustment).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/workouts/live/ses-1/stopped");
  });

  it("does not wait for the injury report before navigating", async () => {
    mocks.abortWorkoutSession.mockResolvedValue(undefined);
    mocks.reportPainInjury.mockReturnValue(new Promise(() => {}));
    const result = renderSync();

    await act(() =>
      result.current.abortSession("pain", "", {
        note: "",
        region: JointRegion.HIP,
        side: BodySide.BOTH,
      }),
    );

    expect(mocks.replace).toHaveBeenCalledWith("/workouts/live/ses-1/stopped");
  });

  it("keeps the note-based adjustment when no region was picked", async () => {
    mocks.abortWorkoutSession.mockResolvedValue(undefined);
    const result = renderSync();

    await act(() =>
      result.current.abortSession("pain", "sore", {
        note: "sore",
        region: JointRegion.UNSPECIFIED,
        side: BodySide.BOTH,
      }),
    );

    expect(mocks.reportPainInjury).not.toHaveBeenCalled();
    expect(mocks.startAIAdjustment).toHaveBeenCalledWith({
      muscleGroup: "sore",
      reason: "injury_reported",
    });
  });

  it("reports nothing and starts no adjustment when the abort fails", async () => {
    mocks.abortWorkoutSession.mockRejectedValue(new Error("down"));
    const result = renderSync();

    await act(() =>
      result.current.abortSession("pain", "", {
        note: "",
        region: JointRegion.KNEE,
        side: BodySide.LEFT,
      }),
    );

    expect(mocks.reportPainInjury).not.toHaveBeenCalled();
    expect(mocks.startAIAdjustment).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith("Could not end the session. Please try again.");
  });
});
