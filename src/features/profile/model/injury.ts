import {
  BodySide,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";
import type {
  Injury,
  InjuryInput,
} from "@/shared/api/gen/contracts/supporting/profile/v1/message/profile_messages_pb";
import { bodySideLabel, jointRegionLabel, muscleGroupLabel } from "@/shared/lib/taxonomy";

import type { InjuryItem } from "./profile.types";

/** What the user picks: region is required, muscle is optional (UNSPECIFIED = none). */
export interface InjuryDraft {
  region: JointRegion;
  muscle: MuscleGroup;
  side: BodySide;
  severity: InjurySeverity;
  notes: string;
}

/** Fields shared by InjuryInput and ReportInjuryRequest. */
export type InjuryInputInit = Pick<
  InjuryInput,
  "region" | "muscle" | "side" | "severity" | "notes"
>;

export const EMPTY_INJURY_DRAFT: InjuryDraft = {
  region: JointRegion.UNSPECIFIED,
  muscle: MuscleGroup.UNSPECIFIED,
  side: BodySide.BOTH,
  severity: InjurySeverity.MILD,
  notes: "",
};

/** Draft to the InjuryInput / ReportInjuryRequest shape; null without a region. */
export function toInjuryInput(draft: InjuryDraft): InjuryInputInit | null {
  if (draft.region === JointRegion.UNSPECIFIED) {
    return null;
  }
  return {
    region: draft.region,
    muscle: draft.muscle,
    side: draft.side,
    severity: draft.severity === InjurySeverity.UNSPECIFIED ? InjurySeverity.MILD : draft.severity,
    notes: draft.notes.trim(),
  };
}

export function toInjuryItem(injury: Partial<Injury>, index: number): InjuryItem {
  return {
    id: injury.injuryId || `inj-${index}`,
    region: injury.region ?? JointRegion.UNSPECIFIED,
    muscle: injury.muscle ?? MuscleGroup.UNSPECIFIED,
    side: injury.side ?? BodySide.UNSPECIFIED,
    severity: injury.severity ?? InjurySeverity.UNSPECIFIED,
    notes: injury.notes ?? "",
    isRecovered: Boolean(injury.isRecovered),
    reportedAt: injury.reportedAt || new Date().toISOString().split("T")[0],
  };
}

/** "Knee · Quadriceps · Left"; side is omitted for both sides. */
export function describeInjury(injury: Pick<InjuryDraft, "region" | "muscle" | "side">): string {
  const parts = [jointRegionLabel(injury.region), muscleGroupLabel(injury.muscle)];
  if (injury.side === BodySide.LEFT || injury.side === BodySide.RIGHT) {
    parts.push(bodySideLabel(injury.side));
  }
  return parts.filter(Boolean).join(" · ");
}
