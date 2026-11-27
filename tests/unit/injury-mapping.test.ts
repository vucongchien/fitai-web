import { describe, expect, it } from "vitest";

import { mapOnboardingInjuries } from "@/features/onboarding/domain/onboarding-mapper";
import { describeInjury, toInjuryInput, toInjuryItem } from "@/features/profile/model/injury";
import {
  BodySide,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

const KNEE_DRAFT = {
  region: JointRegion.KNEE,
  muscle: MuscleGroup.QUADRICEPS,
  side: BodySide.LEFT,
  severity: InjurySeverity.SEVERE,
  notes: "  sharp pain  ",
};

describe("injury mapping (profile)", () => {
  it("maps a draft to the InjuryInput wire fields", () => {
    expect(toInjuryInput(KNEE_DRAFT)).toEqual({
      region: JointRegion.KNEE,
      muscle: MuscleGroup.QUADRICEPS,
      side: BodySide.LEFT,
      severity: InjurySeverity.SEVERE,
      notes: "sharp pain",
    });
  });

  it("returns null without a region (region is required)", () => {
    expect(toInjuryInput({ ...KNEE_DRAFT, region: JointRegion.UNSPECIFIED })).toBeNull();
  });

  it("defaults an UNSPECIFIED severity to MILD", () => {
    expect(toInjuryInput({ ...KNEE_DRAFT, severity: InjurySeverity.UNSPECIFIED })?.severity).toBe(
      InjurySeverity.MILD,
    );
  });

  it("maps a backend Injury into the view model with safe defaults", () => {
    expect(toInjuryItem({ injuryId: "inj-1", region: JointRegion.HIP }, 0)).toMatchObject({
      id: "inj-1",
      region: JointRegion.HIP,
      muscle: MuscleGroup.UNSPECIFIED,
      side: BodySide.UNSPECIFIED,
      severity: InjurySeverity.UNSPECIFIED,
      isRecovered: false,
    });
    expect(toInjuryItem({}, 3).id).toBe("inj-3");
  });

  it("describes region, optional muscle and a single side", () => {
    expect(describeInjury(KNEE_DRAFT)).toBe("Knee · Quadriceps · Left");
    expect(
      describeInjury({
        region: JointRegion.SHOULDER,
        muscle: MuscleGroup.UNSPECIFIED,
        side: BodySide.BOTH,
      }),
    ).toBe("Shoulder");
  });
});

describe("injury mapping (onboarding)", () => {
  const base = {
    injuryStatus: "active" as const,
    injuryRegion: JointRegion.LOWER_BACK,
    injuryMuscle: MuscleGroup.UNSPECIFIED,
    injurySide: BodySide.BOTH,
    injurySeverity: InjurySeverity.MODERATE,
    injuryNotes: "",
  };

  it("sends one injury with a default note when active", () => {
    expect(mapOnboardingInjuries(base)).toEqual([
      {
        region: JointRegion.LOWER_BACK,
        muscle: MuscleGroup.UNSPECIFIED,
        side: BodySide.BOTH,
        severity: InjurySeverity.MODERATE,
        notes: "Reported during onboarding",
      },
    ]);
  });

  it("sends nothing when the user reports no limitation", () => {
    expect(mapOnboardingInjuries({ ...base, injuryStatus: "none" })).toEqual([]);
  });

  it("sends nothing when the region is missing", () => {
    expect(mapOnboardingInjuries({ ...base, injuryRegion: JointRegion.UNSPECIFIED })).toEqual([]);
  });
});
