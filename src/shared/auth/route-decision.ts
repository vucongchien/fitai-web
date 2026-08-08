export type EntryRoute = "/home" | "/login" | "/onboarding";

interface EntryState {
  hasActiveRoadmap: boolean;
  hasValidSession: boolean;
  profileCompletionRate: number;
}

export function resolveEntryRoute({
  hasActiveRoadmap: _hasActiveRoadmap,
  hasValidSession,
  profileCompletionRate,
}: EntryState): EntryRoute {
  if (!hasValidSession) {
    return "/login";
  }
  if (!Number.isFinite(profileCompletionRate) || profileCompletionRate < 80) {
    return "/onboarding";
  }
  return "/home";
}
