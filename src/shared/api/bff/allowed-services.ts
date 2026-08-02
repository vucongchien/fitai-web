export const allowedRpcServices = new Set([
  "contracts.core.coaching.v1.service.CoachingService",
  "contracts.core.nutrition.v1.service.NutritionService",
  "contracts.core.workout_execution.v1.service.WorkoutExecutionService",
  "contracts.generic.audio.v1.service.AudioService",
  "contracts.generic.notification.v1.service.NotificationService",
  "contracts.supporting.exercise.v1.service.ExerciseService",
  "contracts.supporting.profile.v1.service.ProfileService",
]);

export function isAllowedRpcPath(path: string) {
  const [service, method, extra] = path.split("/");
  return !extra && Boolean(method) && allowedRpcServices.has(service);
}
