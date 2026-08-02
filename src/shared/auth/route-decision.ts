export type EntryRoute = "/home" | "/login" | "/onboarding" | "/planning";

type EntryState = {
  hasActiveRoadmap: boolean;
  hasValidSession: boolean;
  profileCompletionRate: number;
};

export function resolveEntryRoute({
  hasActiveRoadmap,
  hasValidSession,
  profileCompletionRate,
}: EntryState): EntryRoute {
  if (!hasValidSession) return "/login";
  if (!Number.isFinite(profileCompletionRate) || profileCompletionRate < 80) {
    return "/onboarding";
  }
  return hasActiveRoadmap ? "/home" : "/planning";
}
