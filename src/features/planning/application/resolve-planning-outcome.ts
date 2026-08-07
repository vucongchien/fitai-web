export type InitiateRoadmapResult = "created" | "duplicate" | "unknown";
export type PlanningNextAction = "continue" | "manual-retry" | "verify-active-roadmap";

interface PlanningOutcomeInput {
  activeRoadmapExists?: boolean;
  initiateResult: InitiateRoadmapResult;
}

export function resolvePlanningOutcome({
  activeRoadmapExists,
  initiateResult,
}: PlanningOutcomeInput): PlanningNextAction {
  if (initiateResult === "created" || activeRoadmapExists === true) {
    return "continue";
  }
  if (activeRoadmapExists === undefined) {
    return "verify-active-roadmap";
  }
  return "manual-retry";
}
