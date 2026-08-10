export function mapGoalToProto(goals: string[] | string): string[] {
  const list = Array.isArray(goals) ? goals : [goals];
  const result: string[] = [];
  for (const g of list) {
    const lower = g?.toLowerCase() || "";
    if (lower.includes("strength") || lower === "strength") {
      if (!result.includes("STRENGTH")) {result.push("STRENGTH");}
    } else if (lower.includes("endurance") || lower === "endurance") {
      if (!result.includes("ENDURANCE")) {result.push("ENDURANCE");}
    } else if (lower.includes("fat") || lower.includes("lose") || lower === "fat_loss") {
      if (!result.includes("FAT_LOSS")) {result.push("FAT_LOSS");}
    } else if (
      lower.includes("muscle") ||
      lower.includes("hypertrophy") ||
      lower === "build_muscle" ||
      lower === "build-muscle"
    ) {
      if (!result.includes("BUILD_MUSCLE")) {result.push("BUILD_MUSCLE");}
    } else {
      if (!result.includes("BUILD_MUSCLE")) {result.push("BUILD_MUSCLE");}
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

export function mapEquipmentToProto(equipmentList: string[]): string[] {
  return equipmentList.map((item) => {
    const upper = (item || "").trim().toUpperCase();
    if (upper.includes("FULL GYM") || upper.includes("FULL_GYM")) {
      return "FULL_GYM";
    }
    if (upper.includes("DUMBBELL")) {
      return "DUMBBELL_ONLY";
    }
    if (upper.includes("BARBELL")) {
      return "BARBELL";
    }
    if (upper.includes("BAND")) {
      return "RESISTANCE_BAND";
    }
    if (upper.includes("KETTLEBELL")) {
      return "KETTLEBELL";
    }
    if (upper.includes("MACHINE")) {
      return "MACHINE";
    }
    if (upper.includes("BODYWEIGHT") || upper.includes("BODY WEIGHT") || upper === "BODY WEIGHT") {
      return "BODYWEIGHT";
    }
    return upper.replaceAll(/\s+/g, "_");
  });
}

export function mapCoachStyleToProto(style: string): string {
  switch (style?.toLowerCase()) {
    case "motivational":
    case "calm": {
      return "MOTIVATIONAL";
    }
    case "strict":
    case "direct": {
      return "STRICT";
    }
    case "scientific":
    case "balanced": {
      return "SCIENTIFIC";
    }
    default: {
      return "MOTIVATIONAL";
    }
  }
}
