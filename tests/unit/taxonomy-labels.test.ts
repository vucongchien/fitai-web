import { describe, expect, it } from "vitest";

import {
  BodySide,
  Equipment,
  ExerciseLevel,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import {
  BODY_SIDE_OPTIONS,
  bodySideLabel,
  CATEGORY_OPTIONS,
  EQUIPMENT_OPTIONS,
  equipmentCode,
  equipmentLabel,
  INJURY_SEVERITY_OPTIONS,
  JOINT_REGION_OPTIONS,
  jointRegionLabel,
  LEVEL_OPTIONS,
  MUSCLE_GROUP_OPTIONS,
  muscleGroupCodeLabel,
  muscleGroupLabel,
  parseEquipmentCode,
  parseLevelCode,
  parseMuscleGroupCode,
} from "@/shared/lib/taxonomy";

describe("taxonomy label map", () => {
  it("derives every option from the generated enums and skips UNSPECIFIED", () => {
    expect(MUSCLE_GROUP_OPTIONS).toHaveLength(17);
    expect(EQUIPMENT_OPTIONS).toHaveLength(12);
    expect(CATEGORY_OPTIONS).toHaveLength(7);
    expect(LEVEL_OPTIONS.map((o) => o.code)).toEqual(["BEGINNER", "INTERMEDIATE", "EXPERT"]);
    expect(JOINT_REGION_OPTIONS).toHaveLength(10);
    expect(INJURY_SEVERITY_OPTIONS.map((o) => o.code)).toEqual(["MILD", "MODERATE", "SEVERE"]);
    expect(BODY_SIDE_OPTIONS.map((o) => o.code)).toEqual(["LEFT", "RIGHT", "BOTH"]);
    for (const options of [MUSCLE_GROUP_OPTIONS, EQUIPMENT_OPTIONS, JOINT_REGION_OPTIONS]) {
      expect(options.some((o) => o.value === 0)).toBe(false);
    }
  });

  it("humanizes codes into English labels with a few overrides", () => {
    expect(muscleGroupLabel(MuscleGroup.LOWER_BACK)).toBe("Lower Back");
    expect(equipmentLabel(Equipment.BODY_ONLY)).toBe("Body Only");
    expect(equipmentLabel(Equipment.EZ_CURL_BAR)).toBe("EZ Curl Bar");
    expect(jointRegionLabel(JointRegion.WRIST_HAND)).toBe("Wrist / Hand");
    expect(jointRegionLabel(JointRegion.ANKLE_FOOT)).toBe("Ankle / Foot");
  });

  it("returns an empty label for UNSPECIFIED", () => {
    expect(muscleGroupLabel(MuscleGroup.UNSPECIFIED)).toBe("");
    expect(equipmentLabel(Equipment.UNSPECIFIED)).toBe("");
  });

  it("treats an UNSPECIFIED side as both sides", () => {
    expect(bodySideLabel(BodySide.UNSPECIFIED)).toBe("Both");
    expect(bodySideLabel(BodySide.LEFT)).toBe("Left");
  });

  it("round-trips short codes", () => {
    expect(parseMuscleGroupCode("quadriceps")).toBe(MuscleGroup.QUADRICEPS);
    expect(parseEquipmentCode(equipmentCode(Equipment.KETTLEBELLS))).toBe(Equipment.KETTLEBELLS);
    expect(parseLevelCode("EXPERT")).toBe(ExerciseLevel.EXPERT);
    expect(parseLevelCode("ADVANCED")).toBeNull();
    expect(parseMuscleGroupCode(undefined)).toBeNull();
  });

  it("labels coaching muscle-group codes and passes unknown tokens through", () => {
    expect(muscleGroupCodeLabel("CHEST")).toBe("Chest");
    expect(muscleGroupCodeLabel("MIDDLE_BACK")).toBe("Middle Back");
    expect(muscleGroupCodeLabel("warmup_cooldown")).toBe("warmup_cooldown");
  });
});
