import type {
  BestPersonalRecord,
  HealthMetricsDetail,
  ProfileViewModel,
} from "./profile.types";

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; category: string } {
  if (!weightKg || !heightCm || heightCm <= 0) {
    return { bmi: 0, category: "No data" };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  let category = "Normal";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi >= 18.5 && bmi <= 24.9) category = "Normal";
  else if (bmi >= 25 && bmi <= 29.9) category = "Overweight";
  else category = "Obese";

  return { bmi, category };
}

export function calculateOneRepMax(weightKg: number, reps: number): number {
  if (!weightKg || weightKg <= 0) return 0;
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

export function translateExperienceLevel(level: string): string {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return level || "Intermediate";
  }
}

export function translateGoal(goal: string): string {
  switch (goal?.toUpperCase()) {
    case "BUILD_MUSCLE":
    case "HYPERTROPHY":
    case "STRENGTH":
      return "Build Muscle";
    case "LOSE_FAT":
    case "FAT_LOSS":
      return "Lose Fat";
    default:
      return goal;
  }
}

export function translateMuscleGroup(group: string): string {
  switch (group?.toUpperCase()) {
    case "CHEST":
      return "Chest";
    case "BACK":
      return "Back";
    case "LEGS":
    case "QUADRICEPS":
    case "HAMSTRINGS":
      return "Legs";
    case "SHOULDERS":
    case "DELTOIDS":
      return "Shoulders";
    case "ARMS":
    case "BICEPS":
    case "TRICEPS":
      return "Arms";
    case "ABS":
    case "CORE":
      return "Core";
    default:
      return group;
  }
}

export function translateEquipment(item: string): string {
  switch (item?.toUpperCase()) {
    case "FULL_GYM":
      return "Full Gym";
    case "DUMBBELL_ONLY":
      return "Dumbbells";
    case "BARBELL":
      return "Barbell";
    case "BODYWEIGHT":
      return "Bodyweight";
    case "RESISTANCE_BAND":
      return "Resistance Band";
    default:
      return item;
  }
}

export function translateCoachStyle(style: string): string {
  switch (style?.toUpperCase()) {
    case "MOTIVATIONAL":
      return "Motivational";
    case "STRICT":
      return "Strict";
    case "SCIENTIFIC":
      return "Scientific";
    default:
      return style || "Motivational";
  }
}

export function translateGender(gender: string): string {
  switch (gender?.toUpperCase()) {
    case "MALE":
      return "Male";
    case "FEMALE":
      return "Female";
    case "OTHER":
      return "Other";
    default:
      return gender || "Not set";
  }
}

export function mapRawDataToProfileViewModel(raw: {
  user?: { id?: string; name?: string; avatarUrl?: string; level?: number };
  profileProto?: any;
  prListProto?: any[];
  statsProto?: { totalWorkouts?: number; activeStreakDays?: number; totalCaloriesKcal?: number };
}): ProfileViewModel {
  const profile = raw.profileProto || {};
  const weight = profile.weightKg || 68.5;
  const height = profile.heightCm || 175;
  const bmiInfo = calculateBMI(weight, height);

  const rawPrs: BestPersonalRecord[] = (raw.prListProto || []).map((pr) => {
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
  });

  const bestPr = rawPrs.length > 0
    ? [...rawPrs].sort((a, b) => b.oneRepMax - a.oneRepMax)[0]
    : {
        exerciseId: "deadlift",
        exerciseName: "Barbell Deadlift",
        weightKg: 140,
        reps: 1,
        oneRepMax: 140,
        achievedAt: "2026-08-01",
      };

  const healthMetrics: HealthMetricsDetail = {
    heightCm: height,
    bmi: bmiInfo.bmi,
    bmiCategory: bmiInfo.category,
    targetBodyFatPercent: profile.targetBodyFatPercent || 15.0,
    goals: (profile.goals || ["BUILD_MUSCLE", "FAT_LOSS"]).map(translateGoal),
    preferredMuscleGroups: (profile.preferredMuscleGroups || ["CHEST", "BACK", "LEGS"]).map(
      translateMuscleGroup
    ),
  };

  return {
    user: {
      id: raw.user?.id || profile.userId || "usr-1001",
      name: raw.user?.name || "Emma Nguyen",
      avatarUrl:
        raw.user?.avatarUrl ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      level: raw.user?.level || 10,
      experienceLevel: translateExperienceLevel(profile.experienceLevel || "INTERMEDIATE"),
      dateOfBirth: profile.dateOfBirth || "1998-05-15",
      gender: translateGender(profile.gender || "FEMALE"),
    },
    bestPr,
    stats: {
      totalWorkouts: raw.statsProto?.totalWorkouts ?? 48,
      activeStreakDays: raw.statsProto?.activeStreakDays ?? 12,
      totalCaloriesKcal: raw.statsProto?.totalCaloriesKcal ?? 12500,
    },
    highlights: {
      currentWeightKg: weight,
      bodyFatPercent: profile.bodyFatPercent || 18.5,
      targetWeightKg: profile.targetWeightKg || 65.0,
    },
    healthMetrics,
    injuries: (profile.injuries || []).map((inj: any, idx: number) => ({
      id: inj.injuryId || `inj-${idx}`,
      muscleGroup: translateMuscleGroup(inj.muscleGroup || "SHOULDERS"),
      severity: inj.severity || "MILD",
      notes: inj.notes || "Be careful with overhead press",
      isRecovered: Boolean(inj.isRecovered),
      reportedAt: inj.reportedAt || "2026-07-15",
    })),
    settings: {
      availableEquipment: (profile.availableEquipment || ["FULL_GYM"]).map(translateEquipment),
      preferredWorkoutTimes: profile.preferredWorkoutTimes || ["Mon PM", "Wed PM", "Fri PM"],
      coachStyle: translateCoachStyle(profile.coachStyle || "MOTIVATIONAL"),
    },
  };
}
