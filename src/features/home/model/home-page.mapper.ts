import type { HomePageData, NutritionSummary, TodayTimelineItem } from "./home-page.types";

// TODO: replace `unknown` with generated proto response types when backend is ready
// import type { GetActiveRoadmapResponse } from "@/shared/api/gen/...";
// import type { GetNutritionSummaryResponse } from "@/shared/api/gen/...";

export function adaptTodayTimeline(_roadmapRes: unknown): TodayTimelineItem[] {
  // TODO: map roadmapRes.currentWeek.sessions → TodayTimelineItem[]
  return [];
}

export function adaptNutritionSummary(_nutritionRes: unknown): NutritionSummary {
  // TODO: map nutritionRes.loggedKcal, nutritionRes.targetKcal
  return { loggedKcal: 0, targetKcal: 0 };
}

export function adaptHomePageData(roadmapRes: unknown, nutritionRes: unknown): HomePageData {
  return {
    streak: { days: 0 }, // TODO: roadmapRes.streak.days
    coachNote: null,     // TODO: roadmapRes.coachNote
    todayTimeline: adaptTodayTimeline(roadmapRes),
    evidenceItems: [],   // TODO: roadmapRes.evidenceItems
    nutritionSummary: adaptNutritionSummary(nutritionRes),
    quickActions: [],    // TODO: static or from config service
  };
}
