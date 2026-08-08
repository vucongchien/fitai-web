export type TodayItemCategory = "meal" | "snack" | "workout";

export type SessionStatus = "complete" | "next" | "planned" | "rest" | "skipped";

export interface TodayTimelineItem {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  category: TodayItemCategory;
  status: SessionStatus;
  href?: string;
}

export interface EvidenceItem {
  id: string;
  icon: "dumbbell" | "shield-check" | "flame" | "zap";
  value: string;
  label: string;
}

export interface NutritionSummary {
  loggedKcal: number;
  targetKcal: number;
}

export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: "dumbbell" | "scale" | "utensils" | "plus";
  colorVariant: string;
}

export interface StreakInfo {
  days: number;
}

export interface MuscleGroupCategoryItem {
  id: string;
  name: string;
  labelVi: string;
  icon: string;
  bgGradient: string;
  accentColor: string;
  queryParam: string;
}

export interface FeaturedExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  durationMins: number;
  prescription: string;
  isWeighted: boolean;
  imageUrl?: string;
}

export interface HomePageData {
  streak: StreakInfo;
  coachNote: string | null;
  userName?: string;
  profileCompletionRate: number;
  missingFields?: string[];
  todayTimeline: TodayTimelineItem[];
  evidenceItems: EvidenceItem[];
  nutritionSummary: NutritionSummary;
  quickActions: QuickAction[];
  featuredExercises: FeaturedExerciseItem[];
  muscleGroups: MuscleGroupCategoryItem[];
  error?: {
    type: "CONNECTION_ERROR" | "NO_ROADMAP";
    message: string;
  };
}
