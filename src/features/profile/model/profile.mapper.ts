import type { BestPersonalRecord, HealthMetricsDetail, ProfileViewModel } from "./profile.types";

export function calculateBMI(
  weightKg: number,
  heightCm: number,
): { bmi: number; category: string } {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { bmi: 0, category: "No data" };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category = "Normal";
  if (bmi < 18.5) {
    category = "Underweight";
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    category = "Normal";
  } else if (bmi >= 25 && bmi <= 29.9) {
    category = "Overweight";
  } else {
    category = "Obese";
  }

  return { bmi, category };
}

export function calculateOneRepMax(weightKg: number, reps: number): number {
  if (!weightKg || weightKg <= 0) {
    return 0;
  }
  if (reps <= 1) {
    return weightKg;
  }
  return Math.round(weightKg * (1 + reps / 30));
}

export function translateExperienceLevel(level: string): string {
  switch (level?.toUpperCase()) {
    case "BEGINNER": {
      return "Beginner";
    }
    case "INTERMEDIATE": {
      return "Intermediate";
    }
    case "ADVANCED": {
      return "Advanced";
    }
    default: {
      return level || "Intermediate";
    }
  }
}

export function translateGoal(goal: string): string {
  switch (goal?.toUpperCase()) {
    case "BUILD_MUSCLE":
    case "HYPERTROPHY": {
      return "Build Muscle";
    }
    case "LOSE_FAT":
    case "FAT_LOSS": {
      return "Lose Fat";
    }
    case "STRENGTH": {
      return "Strength";
    }
    case "ENDURANCE": {
      return "Endurance";
    }
    default: {
      return goal || "Build Muscle";
    }
  }
}

export function translateMuscleGroup(group: string): string {
  switch (group?.toUpperCase()) {
    case "CHEST":
    case "PECTORALIS_MAJOR": {
      return "Chest";
    }
    case "BACK":
    case "LATISSIMUS_DORSI":
    case "TRAPEZIUS": {
      return "Back";
    }
    case "LEGS":
    case "QUADRICEPS":
    case "HAMSTRINGS":
    case "CALVES": {
      return "Legs";
    }
    case "SHOULDERS":
    case "DELTOIDS":
    case "REAR_DELTS":
    case "FRONT_DELTS": {
      return "Shoulders";
    }
    case "ARMS":
    case "BICEPS":
    case "TRICEPS": {
      return "Arms";
    }
    case "ABS":
    case "CORE":
    case "OBLIQUES":
    case "RECTUS_ABDOMINIS": {
      return "Core";
    }
    case "GLUTES":
    case "GLUTEUS_MAXIMUS": {
      return "Glutes";
    }
    case "FULL_BODY":
    case "FULL_BODY_CHAIN": {
      return "Full Body";
    }
    default: {
      return group || "Full Body";
    }
  }
}

export function translateEquipment(item: string): string {
  switch (item?.toUpperCase()) {
    case "FULL_GYM": {
      return "Full Gym";
    }
    case "DUMBBELL_ONLY":
    case "DUMBBELLS":
    case "DUMBBELL": {
      return "Dumbbells";
    }
    case "BARBELL": {
      return "Barbell";
    }
    case "BODYWEIGHT": {
      return "Bodyweight";
    }
    case "RESISTANCE_BAND":
    case "BAND": {
      return "Resistance Band";
    }
    case "KETTLEBELL": {
      return "Kettlebell";
    }
    case "MACHINE": {
      return "Machine";
    }
    default: {
      return item || "Full Gym";
    }
  }
}

export function translateCoachStyle(style: string): string {
  switch (style?.toUpperCase()) {
    case "MOTIVATIONAL": {
      return "Motivational";
    }
    case "STRICT": {
      return "Strict";
    }
    case "SCIENTIFIC": {
      return "Scientific";
    }
    default: {
      return style || "Motivational";
    }
  }
}

export function translateGender(gender: string): string {
  switch (gender?.toUpperCase()) {
    case "MALE": {
      return "Male";
    }
    case "FEMALE": {
      return "Female";
    }
    case "OTHER": {
      return "Other";
    }
    default: {
      if (gender === "Male" || gender === "Female" || gender === "Other") {
        return gender;
      }
      return gender || "Not set";
    }
  }
}

export function mapRawDataToProfileViewModel(raw: {
  user?: { id?: string; name?: string; avatarUrl?: string; level?: number };
  profileProto?: any;
  prListProto?: any[];
  statsProto?: { totalWorkouts?: number; activeStreakDays?: number; totalCaloriesKcal?: number };
  notificationProto?: {
    enablePush?: boolean;
    enableEmail?: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  };
}): ProfileViewModel {
  const profile = raw.profileProto || {};
  const weight = profile.weightKg || 0;
  const height = profile.heightCm || 0;
  const bmiInfo = calculateBMI(weight, height);

  const rawPrs: BestPersonalRecord[] =
    raw.prListProto && raw.prListProto.length > 0
      ? raw.prListProto.map((pr) => {
          const w = pr.weight || pr.weightKg || 0;
          const r = pr.reps || 1;
          const calculated1RM = pr.oneRepMax || calculateOneRepMax(w, r);
          return {
            exerciseId: pr.exerciseId || "ex-1",
            exerciseName: pr.exerciseName || translateMuscleGroup(pr.exerciseId) || "Exercise",
            weightKg: w,
            reps: r,
            oneRepMax: calculated1RM,
            achievedAt: pr.achievedAt || new Date().toISOString().split("T")[0],
          };
        })
      : [];

  const bestPr =
    rawPrs.length > 0 ? [...rawPrs].sort((a, b) => b.oneRepMax - a.oneRepMax)[0] : null;

  const healthMetrics: HealthMetricsDetail = {
    heightCm: height,
    bmi: bmiInfo.bmi,
    bmiCategory: bmiInfo.category,
    targetBodyFatPercent: profile.targetBodyFatPercent || 0,
    goals: (profile.goals || []).map(translateGoal),
    preferredMuscleGroups: (profile.preferredMuscleGroups || []).map(
      translateMuscleGroup,
    ),
  };

  const userName = raw.user?.name || profile.fullName || "Athlete";
  console.log(raw.user);
  return {
    user: {
      id: raw.user?.id || profile.userId || "usr-me",
      name: userName,
      avatarUrl:
        raw.user?.avatarUrl ||
        profile.avatarUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      level: raw.user?.level || 1,
      experienceLevel: translateExperienceLevel(profile.experienceLevel || ""),
      dateOfBirth: profile.dateOfBirth || "",
      gender: translateGender(profile.gender || ""),
    },
    bestPr,
    stats: {
      totalWorkouts: raw.statsProto?.totalWorkouts ?? 0,
      activeStreakDays: raw.statsProto?.activeStreakDays ?? 0,
      totalCaloriesKcal: raw.statsProto?.totalCaloriesKcal ?? 0,
    },
    highlights: {
      currentWeightKg: weight,
      bodyFatPercent: profile.bodyFatPercent || 0,
      targetWeightKg: profile.targetWeightKg || 0,
    },
    healthMetrics,
    injuries: (profile.injuries || []).map((inj: any, idx: number) => ({
      id: inj.injuryId || `inj-${idx}`,
      muscleGroup: translateMuscleGroup(inj.muscleGroup || ""),
      severity: inj.severity || "MILD",
      notes: inj.notes || "",
      isRecovered: Boolean(inj.isRecovered),
      reportedAt: inj.reportedAt || new Date().toISOString().split("T")[0],
    })),
    settings: {
      availableEquipment: (profile.availableEquipment || []).map(translateEquipment),
      preferredWorkoutTimes: profile.preferredWorkoutTimes || [],
      coachStyle: translateCoachStyle(profile.coachStyle || ""),
    },
  };
}
