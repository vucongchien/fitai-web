import { describe, expect, it } from "vitest";

import { initialFatiguePercent } from "@/features/workout/ui/live/set-confirm-dialog";

describe("initialFatiguePercent", () => {
  it("starts at the prescribed effort, on the slider's 5% steps", () => {
    expect(initialFatiguePercent(6.5)).toBe(65);
    expect(initialFatiguePercent(8.3)).toBe(85);
    expect(initialFatiguePercent(10)).toBe(100);
  });

  it("falls back to RPE 7 when the line has no target", () => {
    expect(initialFatiguePercent(0)).toBe(70);
  });
});
