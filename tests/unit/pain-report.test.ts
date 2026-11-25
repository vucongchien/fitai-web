import { describe, expect, it } from "vitest";

import { toPainInjuryDraft } from "@/features/workout/domain/pain-report";
import {
  BodySide,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

describe("pain report → injury (spec §8.7)", () => {
  it("reports a picked region as a MODERATE injury", () => {
    expect(
      toPainInjuryDraft({ note: "sharp", region: JointRegion.KNEE, side: BodySide.LEFT }),
    ).toEqual({
      region: JointRegion.KNEE,
      muscle: MuscleGroup.UNSPECIFIED,
      side: BodySide.LEFT,
      severity: InjurySeverity.MODERATE,
      notes: "sharp",
    });
  });

  it("falls back to a default note and both sides", () => {
    const draft = toPainInjuryDraft({
      note: "  ",
      region: JointRegion.SHOULDER,
      side: BodySide.UNSPECIFIED,
    });
    expect(draft?.notes).toBe("Reported during a workout");
    expect(draft?.side).toBe(BodySide.BOTH);
  });

  it("reports nothing without a region", () => {
    expect(
      toPainInjuryDraft({ note: "knee", region: JointRegion.UNSPECIFIED, side: BodySide.BOTH }),
    ).toBeNull();
  });
});
