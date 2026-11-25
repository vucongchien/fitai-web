import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BodySide,
  InjurySeverity,
  JointRegion,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

const mocks = vi.hoisted(() => ({
  reportInjury: vi.fn(),
  startAIAdjustment: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/features/profile/server/profile-actions", () => ({
  reportInjuryServerAction: mocks.reportInjury,
}));
vi.mock("@/features/roadmap/model/ai-adjustment-store", () => ({
  startAIAdjustment: mocks.startAIAdjustment,
}));
vi.mock("@/shared/ui/toast", () => ({ toast: { error: mocks.toastError } }));

import {
  PAIN_INJURY_SAVE_FAILED,
  painNoteLabel,
  reportPainInjury,
} from "@/features/workout/model/report-pain-injury";

const KNEE_LEFT = { note: "", region: JointRegion.KNEE, side: BodySide.LEFT };

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  mocks.reportInjury.mockReset();
  mocks.startAIAdjustment.mockReset();
  mocks.toastError.mockReset();
});

describe("reportPainInjury", () => {
  it("skips the RPC without a region", async () => {
    await expect(
      reportPainInjury({ note: "x", region: JointRegion.UNSPECIFIED, side: BodySide.BOTH }),
    ).resolves.toBeNull();
    expect(mocks.reportInjury).not.toHaveBeenCalled();
  });

  it("starts the AI adjustment with the described region once saved", async () => {
    mocks.reportInjury.mockResolvedValue({ success: true, injuryId: "inj-1" });

    await expect(reportPainInjury(KNEE_LEFT)).resolves.toBe("saved");

    expect(mocks.reportInjury).toHaveBeenCalledWith(
      expect.objectContaining({ region: JointRegion.KNEE, severity: InjurySeverity.MODERATE }),
    );
    expect(mocks.startAIAdjustment).toHaveBeenCalledWith({
      reason: "injury_reported",
      muscleGroup: "Knee · Left",
    });
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("shows a toast and no adjustment when the save fails", async () => {
    mocks.reportInjury.mockResolvedValue({ success: false, message: "boom" });

    await expect(reportPainInjury(KNEE_LEFT)).resolves.toBe("failed");

    expect(mocks.toastError).toHaveBeenCalledWith(PAIN_INJURY_SAVE_FAILED);
    expect(mocks.startAIAdjustment).not.toHaveBeenCalled();
  });

  it("treats a rejected call like a failed save", async () => {
    mocks.reportInjury.mockRejectedValue(new Error("offline"));

    await expect(reportPainInjury(KNEE_LEFT)).resolves.toBe("failed");

    expect(mocks.toastError).toHaveBeenCalledWith(PAIN_INJURY_SAVE_FAILED);
    expect(mocks.startAIAdjustment).not.toHaveBeenCalled();
  });

  it("stays silent and does not adjust when the injury already exists", async () => {
    mocks.reportInjury.mockResolvedValue({ success: false, alreadyExists: true });

    await expect(reportPainInjury(KNEE_LEFT)).resolves.toBe("exists");

    expect(mocks.toastError).not.toHaveBeenCalled();
    expect(mocks.startAIAdjustment).not.toHaveBeenCalled();
  });
});

describe("painNoteLabel", () => {
  it("falls back to a generic area and shortens long notes", () => {
    expect(painNoteLabel(undefined)).toBe("Reported Area");
    expect(painNoteLabel("knee")).toBe("knee");
    expect(painNoteLabel("a very long description of pain")).toBe("a very long descript...");
  });
});
