import type { RoadmapPageData, SessionPlanPageData } from "./roadmap-page.types";

// TODO: replace `unknown` with generated proto response types when backend is ready
// import type { GetActiveRoadmapResponse } from "@/shared/api/gen/...";
// import type { GetSessionPlanResponse, GetInjuryHistoryResponse } from "@/shared/api/gen/...";

export function adaptRoadmapPageData(_roadmapRes: unknown): RoadmapPageData {
  // TODO: map roadmapRes.weekPlans → weeks, currentWeekSessions, contextItems
  throw new Error("adaptRoadmapPageData: not implemented");
}

export function adaptSessionPlanPageData(
  _sessionRes: unknown,
  _injuryRes: unknown,
): SessionPlanPageData {
  // TODO: map sessionRes.exercises, sessionRes.reasoning, injuryRes → readinessNote
  throw new Error("adaptSessionPlanPageData: not implemented");
}
