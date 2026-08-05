export type TodayItemCategory = "meal" | "snack" | "workout";

export type SessionStatus = "complete" | "next" | "planned" | "rest" | "skipped";

export type TodayTimelineItem = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  category: TodayItemCategory;
  status: SessionStatus;
  href?: string;
};

export type EvidenceItem = {
  id: string;
  icon: "dumbbell" | "shield-check" | "flame" | "zap";
  value: string;
  label: string;
};

export type NutritionSummary = {
  loggedKcal: number;
  targetKcal: number;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  icon: "dumbbell" | "scale" | "utensils" | "plus";
  colorVariant: string;
};

export type StreakInfo = {
  days: number;
};

export type HomePageData = {
  streak: StreakInfo;
  coachNote: string | null;
  todayTimeline: TodayTimelineItem[];
  evidenceItems: EvidenceItem[];
  nutritionSummary: NutritionSummary;
  quickActions: QuickAction[];
};
