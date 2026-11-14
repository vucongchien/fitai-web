export interface PersonalRecord {
  id: string;
  exerciseName: string;
  metric: string; // E.g. "100 kg", "15 reps"
  value: number;
  unit: "kg" | "reps" | "sec";
  achievedAt: string; // ISO string date
}

export type ActivityStatus = "completed" | "recovery" | "rest" | "missed";
export type NutritionStatus = "completed" | "off_target" | "none";

export interface WeeklyActivityDay {
  dayLabel: string; // "Mon", "Tue", etc.
  date: string; // "YYYY-MM-DD"
  status: ActivityStatus;
  sessionTitle?: string;
  nutritionStatus?: NutritionStatus;
}

export interface RoadmapAdherence {
  totalSessionsScheduled: number;
  sessionsCompleted: number;
  currentWeek: number;
  totalWeeks: number;
  adherencePercentage: number;
}

export interface WeeklyNutritionSummary {
  avgDailyCalories: number;
  targetDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface UserProgressStats {
  currentStreakDays: number;
  bestStreakDays: number;
  totalWorkoutsCompleted: number;
  totalVolumeKg: number;
  adherence: RoadmapAdherence;
  weeklyActivity: WeeklyActivityDay[];
  personalRecords: PersonalRecord[];
  weeklyNutrition: WeeklyNutritionSummary;
}

export type MetricKey = "weightKg" | "bodyFatPercent";

export interface BodyMetricEntry {
  id: string;
  loggedAt: string;
  dateLabel: string;
  weightKg: number;
  bodyFatPercent: number;
  heightCm: number;
  bmi: number;
  leanMassKg: number;
  fatMassKg: number;
  progressPhotoUrl: string;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Nov 12"
  count: number;
  totalMinutes: number;
  intensity: 0 | 1 | 2 | 3;
}

export interface HeatmapWeek {
  weekIndex: number;
  monthLabel?: string;
  days: HeatmapDay[];
}

export type BodyZoneId = "full" | "upper" | "core" | "lower";

export interface ActiveInjurySummary {
  muscleGroup: string;
  severity: string;
}

export interface ProgressDashboardData {
  athleteName: string;
  currentWeightKg: number;
  targetWeightKg: number;
  currentBodyFatPercent: number;
  targetBodyFatPercent: number;
  heightCm: number;
  entries: BodyMetricEntry[];
  photos: BodyMetricEntry[];
  weeklyGoal: {
    completed: number;
    target: number;
    percentage: number;
  };
  streakDays: number;
  totalWorkouts: number;
  totalVolumeKg: number;
  adherencePercentage: number;
  heatmapWeeks: HeatmapWeek[];
  preferredMuscleGroups: string[];
  activeInjuries: ActiveInjurySummary[];
  gender?: string;
}
