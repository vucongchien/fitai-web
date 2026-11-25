// Single label map for the exercise taxonomy enums (spec §4). Values come from the generated
// proto enums; the short code is the enum key (e.g. `QUADRICEPS`), matching the backend.
import {
  BodySide,
  Equipment,
  ExerciseCategory,
  ExerciseForce,
  ExerciseLevel,
  ExerciseMechanic,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

type NumericEnum = Record<string, string | number>;

export interface EnumOption<T extends number> {
  value: T;
  code: string;
  label: string;
}

const LABEL_OVERRIDES: Record<string, string> = {
  EZ_CURL_BAR: "EZ Curl Bar",
  WRIST_HAND: "Wrist / Hand",
  ANKLE_FOOT: "Ankle / Foot",
};

function humanize(code: string): string {
  const override = LABEL_OVERRIDES[code];
  if (override) {
    return override;
  }
  return code
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildOptions<T extends number>(enumObject: NumericEnum): EnumOption<T>[] {
  return Object.values(enumObject)
    .filter((value): value is T => typeof value === "number" && value !== 0)
    .map((value) => {
      const code = String(enumObject[value]);
      return { value, code, label: humanize(code) };
    });
}

export const MUSCLE_GROUP_OPTIONS = buildOptions<MuscleGroup>(MuscleGroup);
export const EQUIPMENT_OPTIONS = buildOptions<Equipment>(Equipment);
export const CATEGORY_OPTIONS = buildOptions<ExerciseCategory>(ExerciseCategory);
export const LEVEL_OPTIONS = buildOptions<ExerciseLevel>(ExerciseLevel);
export const FORCE_OPTIONS = buildOptions<ExerciseForce>(ExerciseForce);
export const MECHANIC_OPTIONS = buildOptions<ExerciseMechanic>(ExerciseMechanic);
export const JOINT_REGION_OPTIONS = buildOptions<JointRegion>(JointRegion);
export const INJURY_SEVERITY_OPTIONS = buildOptions<InjurySeverity>(InjurySeverity);
// UNSPECIFIED means BOTH on the wire, so BOTH is the only explicit "both sides" choice.
export const BODY_SIDE_OPTIONS = buildOptions<BodySide>(BodySide);

function labelOf<T extends number>(options: EnumOption<T>[], value: T | undefined): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

function parseCode<T extends number>(options: EnumOption<T>[], code: string | undefined): T | null {
  if (!code) {
    return null;
  }
  const normalized = code.trim().toUpperCase();
  return options.find((option) => option.code === normalized)?.value ?? null;
}

function codeOf<T extends number>(options: EnumOption<T>[], value: T): string {
  return options.find((option) => option.value === value)?.code ?? "";
}

export const muscleGroupLabel = (value: MuscleGroup | undefined) =>
  labelOf(MUSCLE_GROUP_OPTIONS, value);
export const equipmentLabel = (value: Equipment | undefined) => labelOf(EQUIPMENT_OPTIONS, value);
export const categoryLabel = (value: ExerciseCategory | undefined) =>
  labelOf(CATEGORY_OPTIONS, value);
export const levelLabel = (value: ExerciseLevel | undefined) => labelOf(LEVEL_OPTIONS, value);
export const forceLabel = (value: ExerciseForce | undefined) => labelOf(FORCE_OPTIONS, value);
export const mechanicLabel = (value: ExerciseMechanic | undefined) =>
  labelOf(MECHANIC_OPTIONS, value);
export const jointRegionLabel = (value: JointRegion | undefined) =>
  labelOf(JOINT_REGION_OPTIONS, value);
export const injurySeverityLabel = (value: InjurySeverity | undefined) =>
  labelOf(INJURY_SEVERITY_OPTIONS, value);
export const bodySideLabel = (value: BodySide | undefined) =>
  value === BodySide.UNSPECIFIED
    ? labelOf(BODY_SIDE_OPTIONS, BodySide.BOTH)
    : labelOf(BODY_SIDE_OPTIONS, value);

export const parseMuscleGroupCode = (code: string | undefined) =>
  parseCode(MUSCLE_GROUP_OPTIONS, code);
export const parseEquipmentCode = (code: string | undefined) => parseCode(EQUIPMENT_OPTIONS, code);
export const parseCategoryCode = (code: string | undefined) => parseCode(CATEGORY_OPTIONS, code);
export const parseLevelCode = (code: string | undefined) => parseCode(LEVEL_OPTIONS, code);

export const muscleGroupCode = (value: MuscleGroup) => codeOf(MUSCLE_GROUP_OPTIONS, value);
export const equipmentCode = (value: Equipment) => codeOf(EQUIPMENT_OPTIONS, value);
export const categoryCode = (value: ExerciseCategory) => codeOf(CATEGORY_OPTIONS, value);
export const levelCode = (value: ExerciseLevel) => codeOf(LEVEL_OPTIONS, value);

/** Label for a MuscleGroup code sent as a string; unknown codes pass through. */
export function muscleGroupCodeLabel(code: string): string {
  const value = parseMuscleGroupCode(code);
  return value === null ? code : muscleGroupLabel(value);
}
