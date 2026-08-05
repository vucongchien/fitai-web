export type PersonalRecord = {
  id: string;
  exerciseName: string;
  metric: string; // e.g. "100 kg", "15 reps"
  value: number;
  unit: "kg" | "reps" | "sec";
  achievedAt: string; // ISO string date
};

export type ActivityStatus = "completed" | "recovery" | "rest" | "missed";
export type NutritionStatus = "completed" | "off_target" | "none";

export type WeeklyActivityDay = {
  dayLabel: string; // "Mon", "Tue", etc.
  date: string; // "YYYY-MM-DD"
  status: ActivityStatus;
  sessionTitle?: string;
  nutritionStatus?: NutritionStatus;
};

export type RoadmapAdherence = {
  totalSessionsScheduled: number;
  sessionsCompleted: number;
  currentWeek: number;
  totalWeeks: number;
  adherencePercentage: number;
};

export type WeeklyNutritionSummary = {
  avgDailyCalories: number;
  targetDailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  avgWaterLiters: number;
};

export type UserProgressStats = {
  currentStreakDays: number;
  bestStreakDays: number;
  totalWorkoutsCompleted: number;
  totalVolumeKg: number;
  adherence: RoadmapAdherence;
  weeklyActivity: WeeklyActivityDay[];
  personalRecords: PersonalRecord[];
  weeklyNutrition: WeeklyNutritionSummary;
};
