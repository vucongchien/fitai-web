import type { InjuryDraft } from "@/features/profile/model/injury";
import {
  BodySide,
  InjurySeverity,
  JointRegion,
  MuscleGroup,
} from "@/shared/api/gen/contracts/supporting/exercise/v1/message/taxonomy_pb";

/** What the pain dialog hands back; region stays UNSPECIFIED when the user skipped it. */
export interface PainReport {
  note: string;
  region: JointRegion;
  side: BodySide;
}

const DEFAULT_NOTE = "Reported during a workout";

// Spec §8.7: a picked region becomes a MODERATE injury (editable later in the profile);
// without a region nothing is reported.
export function toPainInjuryDraft(report: PainReport): InjuryDraft | null {
  if (report.region === JointRegion.UNSPECIFIED) {
    return null;
  }
  return {
    region: report.region,
    muscle: MuscleGroup.UNSPECIFIED,
    side: report.side === BodySide.UNSPECIFIED ? BodySide.BOTH : report.side,
    severity: InjurySeverity.MODERATE,
    notes: report.note.trim() || DEFAULT_NOTE,
  };
}
