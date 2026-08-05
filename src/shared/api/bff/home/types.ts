/**
 * BFF Home layer types.
 *
 * Các type này là shape mà Server Component (BFF) trả về cho Home page.
 * Tổng hợp từ:
 *   - CoachingService.getActiveRoadmap → streak, todayTimeline, evidenceItems, coachNote
 *   - NutritionService.getNutritionSummary → nutritionSummary
 */

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
  /** lucide icon name để component render đúng icon */
  icon: "dumbbell" | "shield-check" | "flame" | "zap";
  value: string;
  label: string;
};

export type NutritionSummary = {
  /** kcal đã log trong ngày */
  loggedKcal: number;
  /** kcal mục tiêu trong ngày */
  targetKcal: number;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  /** lucide icon name */
  icon: "dumbbell" | "scale" | "utensils" | "plus";
  /** CSS modifier class suffix, vd: "blue", "green", "coral" */
  colorVariant: string;
};

export type StreakInfo = {
  days: number;
};

export type HomePageData = {
  streak: StreakInfo;
  /** null = không có coach note hôm nay */
  coachNote: string | null;
  todayTimeline: TodayTimelineItem[];
  evidenceItems: EvidenceItem[];
  nutritionSummary: NutritionSummary;
  quickActions: QuickAction[];
};
