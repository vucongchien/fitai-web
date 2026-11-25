import { describeInjury } from "@/features/profile/model/injury";
import { reportInjuryServerAction } from "@/features/profile/server/profile-actions";
import { startAIAdjustment } from "@/features/roadmap/model/ai-adjustment-store";
import type { PainReport } from "@/features/workout/domain/pain-report";
import { toPainInjuryDraft } from "@/features/workout/domain/pain-report";
import { toast } from "@/shared/ui/toast";

export const PAIN_INJURY_SAVE_FAILED = "Couldn't save the injury — add it in Profile.";

export type PainInjuryOutcome = "saved" | "exists" | "failed";

const NOTE_LABEL_MAX = 20;

/** Banner label when no region was picked: the note, shortened, or a generic area. */
export function painNoteLabel(note?: string): string {
  if (!note) {
    return "Reported Area";
  }
  return note.length > NOTE_LABEL_MAX ? `${note.slice(0, NOTE_LABEL_MAX)}...` : note;
}

// Saves a pain-dialog region as an injury (spec §8.7); AI-adjusting starts once it is saved.
// A failure shows a global toast, a duplicate stays silent.
export async function reportPainInjury(report: PainReport): Promise<PainInjuryOutcome | null> {
  const draft = toPainInjuryDraft(report);
  if (!draft) {
    return null;
  }

  const res = await reportInjuryServerAction(draft).catch((error: unknown) => {
    console.warn("[reportPainInjury] injury report failed:", error);
    return null;
  });

  if (res?.success) {
    startAIAdjustment({ reason: "injury_reported", muscleGroup: describeInjury(draft) });
    return "saved";
  }
  if (res?.alreadyExists) {
    return "exists";
  }
  console.warn("[reportPainInjury] injury not saved:", res?.message);
  toast.error(PAIN_INJURY_SAVE_FAILED);
  return "failed";
}
