import "server-only";

import { createClient } from "@connectrpc/connect";

import type { WorkoutStatsData } from "@/features/workout-stats/model/workout-stats.types";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { flattenSessionPlans } from "@/shared/api/bff/aggregate/workout-adherence";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { adaptWorkoutStatsData } from "../model/workout-stats.mapper";

/**
 * Fetches real workout stats shared by the Workout and Weekly Progress views.
 */
export async function getWorkoutStatsData(): Promise<WorkoutStatsData> {
  const { accessToken, userId } = await getAuthenticatedSession();
  const today = toDayKey(new Date());
  const todayStr = today || new Date().toISOString().split("T")[0];

  const emptyStats: WorkoutStatsData = {
    adherence: { scheduled: 0, completed: 0, percentage: 0 },
    dateLabel: "",
    minutesToday: 0,
    volumeKg: 0,
    volumeTrend: [],
  };

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const coachingClient = createClient(CoachingService, transport);
      const workoutClient = createClient(WorkoutExecutionService, transport);

      const [roadmapRes, historyRes] = await Promise.allSettled([
        coachingClient.getActiveRoadmap({ userId: userId || "" }),
        workoutClient.getWorkoutHistory({ limit: 60, offset: 0 }),
      ]);

      const roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.roadmap : undefined;
      const history = historyRes.status === "fulfilled" ? historyRes.value.sessions : [];

      if (roadmapRes.status === "fulfilled" && !roadmapRes.value.roadmap) {
        return {
          ...emptyStats,
          error: {
            type: "NO_ROADMAP",
            message: "Active roadmap not found.",
          },
        };
      }

      const sessionPlans = roadmap ? flattenSessionPlans(roadmap as any) : [];

      return adaptWorkoutStatsData(sessionPlans as any, history as any, todayStr);
    } catch (error) {
      console.warn("[getWorkoutStatsData] gRPC call failed:", error);
      return {
        ...emptyStats,
        error: {
          type: "CONNECTION_ERROR",
          message: error instanceof Error ? error.message : "Connection reset",
        },
      };
    }
  }

  return {
    ...emptyStats,
    error: {
      type: "CONNECTION_ERROR",
      message: "gRPC backend address not configured.",
    },
  };
}
