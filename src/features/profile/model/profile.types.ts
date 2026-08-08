export interface ProfileUser {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  experienceLevel: string;
  dateOfBirth: string;
  gender: string;
}

export interface BestPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weightKg: number;
  reps: number;
  oneRepMax: number;
  achievedAt: string;
}

export interface ProfileQuickStats {
  totalWorkouts: number;
  activeStreakDays: number;
  totalCaloriesKcal: number;
}

export interface ProfileHighlightMetrics {
  currentWeightKg: number;
  bodyFatPercent: number;
  targetWeightKg: number;
}

export interface HealthMetricsDetail {
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  targetBodyFatPercent: number;
  goals: string[];
  preferredMuscleGroups: string[];
}

export interface InjuryItem {
  id: string;
  muscleGroup: string;
  severity: "MILD" | "MODERATE" | "SEVERE" | string;
  notes: string;
  isRecovered: boolean;
  reportedAt: string;
}

export interface ProfileSettings {
  availableEquipment: string[];
  preferredWorkoutTimes: string[] | Record<string, string[]>;
  coachStyle: string;
}

export interface ProfileViewModel {
  user: ProfileUser;
  bestPr: BestPersonalRecord | null;
  stats: ProfileQuickStats;
  highlights: ProfileHighlightMetrics;
  healthMetrics: HealthMetricsDetail;
  injuries: InjuryItem[];
  settings: ProfileSettings;
}
