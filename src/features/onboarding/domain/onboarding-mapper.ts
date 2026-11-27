import type { InjuryInputInit } from "@/features/profile/model/injury";
import { toInjuryInput } from "@/features/profile/model/injury";

import type { OnboardingValues } from "./onboarding-schema";

export function mapGoalToProto(goals: string[] | string): string[] {
  const list = Array.isArray(goals) ? goals : [goals];
  const result: string[] = [];
  for (const g of list) {
    const lower = g?.toLowerCase() || "";
    if (lower.includes("strength") || lower === "strength") {
      if (!result.includes("STRENGTH")) {
        result.push("STRENGTH");
      }
    } else if (lower.includes("endurance") || lower === "endurance") {
      if (!result.includes("ENDURANCE")) {
        result.push("ENDURANCE");
      }
    } else if (lower.includes("fat") || lower.includes("lose") || lower === "fat_loss") {
      if (!result.includes("FAT_LOSS")) {
        result.push("FAT_LOSS");
      }
    } else if (
      lower.includes("muscle") ||
      lower.includes("hypertrophy") ||
      lower === "build_muscle" ||
      lower === "build-muscle"
    ) {
      if (!result.includes("BUILD_MUSCLE")) {
        result.push("BUILD_MUSCLE");
      }
    } else {
      if (!result.includes("BUILD_MUSCLE")) {
        result.push("BUILD_MUSCLE");
      }
    }
  }
  return result.length > 0 ? result : ["BUILD_MUSCLE"];
}

export function mapExperienceToProto(exp: string): string {
  switch (exp?.toLowerCase()) {
    case "beginner": {
      return "BEGINNER";
    }
    case "intermediate": {
      return "INTERMEDIATE";
    }
    case "advanced": {
      return "ADVANCED";
    }
    default: {
      return "INTERMEDIATE";
    }
  }
}

export function mapCoachStyleToProto(style: string): string {
  switch (style?.toLowerCase()) {
    case "motivational": {
      return "MOTIVATIONAL";
    }
    case "strict": {
      return "STRICT";
    }
    case "scientific": {
      return "SCIENTIFIC";
    }
    default: {
      return "MOTIVATIONAL";
    }
  }
}

export function mapOnboardingInjuries(
  values: Pick<
    OnboardingValues,
    | "injuryStatus"
    | "injuryRegion"
    | "injuryMuscle"
    | "injurySide"
    | "injurySeverity"
    | "injuryNotes"
  >,
): InjuryInputInit[] {
  if (values.injuryStatus === "none") {
    return [];
  }
  const input = toInjuryInput({
    region: values.injuryRegion,
    muscle: values.injuryMuscle,
    side: values.injurySide,
    severity: values.injurySeverity,
    notes: values.injuryNotes?.trim() || "Reported during onboarding",
  });
  return input ? [input] : [];
}
