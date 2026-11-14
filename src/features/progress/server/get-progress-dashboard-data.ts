import { createClient } from "@connectrpc/connect";
import { redirect } from "next/navigation";
import "server-only";

import { adaptWorkoutStatsData } from "@/features/workout-stats/model/workout-stats.mapper";
import { toDayKey } from "@/shared/api/bff/aggregate/day-key";
import { flattenSessionPlans, historyInWindow } from "@/shared/api/bff/aggregate/workout-adherence";
import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";
import { calculateConsecutiveStreakDays } from "@/shared/utils/streak";

import {
  buildConsistencyHeatmap,
  calculateAdherencePercentage,
  mapPeriodicMetricsToEntries,
} from "../model/progress-aggregator";
import type { ProgressDashboardData } from "../model/types";

export async function getProgressDashboardData(): Promise<ProgressDashboardData> {
  const { accessToken, userId, userName } = await getAuthenticatedSession();
  if (!accessToken) {
    redirect("/login");
  }

  const athleteName = userName || (userId ? `Athlete ${userId.slice(-4)}` : "Athlete");
  const todayStr = toDayKey(new Date()) || new Date().toISOString().split("T")[0];

  const fallbackData: ProgressDashboardData = {
    athleteName,
    currentWeightKg: 0,
    targetWeightKg: 0,
    currentBodyFatPercent: 0,
    targetBodyFatPercent: 0,
    heightCm: 0,
    entries: [],
    photos: [],
    weeklyGoal: {
      completed: 0,
      target: 4,
      percentage: 0,
    },
    streakDays: 0,
    totalWorkouts: 0,
    totalVolumeKg: 0,
    adherencePercentage: 0,
    heatmapWeeks: buildConsistencyHeatmap([], new Date(), 12),
    preferredMuscleGroups: [],
    activeInjuries: [],
  };

  if (!process.env.FITAI_RPC_URL) {
    return fallbackData;
  }

  try {
    const transport = createServerTransport(accessToken);
    const profileClient = createClient(ProfileService, transport);
    const workoutClient = createClient(WorkoutExecutionService, transport);
    const coachingClient = createClient(CoachingService, transport);

    const [profileRes, metricsHistoryRes, injuryHistoryRes, workoutHistoryRes, roadmapRes] =
      await Promise.allSettled([
        profileClient.getProfile({ userId: userId || "" }),
        profileClient.getBodyMetricsHistory({ userId: userId || "" }),
        profileClient.getInjuryHistory({ userId: userId || "" }),
        workoutClient.getWorkoutHistory({ limit: 120, offset: 0 }),
        coachingClient.getActiveRoadmap({ userId: userId || "" }),
      ]);

    const profileProto = profileRes.status === "fulfilled" ? profileRes.value : undefined;
    const rawMetrics =
      metricsHistoryRes.status === "fulfilled" ? metricsHistoryRes.value.metrics : [];
    const rawInjuries =
      injuryHistoryRes.status === "fulfilled" ? injuryHistoryRes.value.injuries : [];
    const historySessions =
      workoutHistoryRes.status === "fulfilled" ? workoutHistoryRes.value.sessions : [];
    const roadmap = roadmapRes.status === "fulfilled" ? roadmapRes.value.roadmap : undefined;

    const profileHeightCm = profileProto?.heightCm ?? 0;
    const entries = mapPeriodicMetricsToEntries(rawMetrics, profileHeightCm);
    const latestEntry = entries.at(-1);

    const currentWeightKg =
      latestEntry && latestEntry.weightKg > 0
        ? latestEntry.weightKg
        : Math.round((profileProto?.weightKg ?? 0) * 10) / 10;

    const currentBodyFatPercent =
      latestEntry && latestEntry.bodyFatPercent > 0
        ? latestEntry.bodyFatPercent
        : Math.round((profileProto?.bodyFatPercent ?? 0) * 10) / 10;

    const heightCm =
      latestEntry && latestEntry.heightCm > 0 ? latestEntry.heightCm : Math.round(profileHeightCm);

    const targetWeightKg = Math.round((profileProto?.targetWeightKg ?? 0) * 10) / 10;
    const targetBodyFatPercent = Math.round((profileProto?.targetBodyFatPercent ?? 0) * 10) / 10;

    const photos = entries.filter((e) => Boolean(e.progressPhotoUrl));

    const totalWorkouts = historySessions.length;
    const totalVolumeKg = Math.round(
      historySessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0),
    );
    const streakDays = calculateConsecutiveStreakDays(historySessions);

    const sessionPlans = roadmap ? flattenSessionPlans(roadmap as any) : [];
    const workoutStats = adaptWorkoutStatsData(
      sessionPlans as any,
      historySessions as any,
      todayStr,
    );

    const weeklyTarget =
      workoutStats.adherence.scheduled > 0
        ? workoutStats.adherence.scheduled
        : Math.max(3, profileProto?.preferredWorkoutTimes?.length || 4);
    const weeklyCompleted =
      workoutStats.adherence.scheduled > 0
        ? workoutStats.adherence.completed
        : historyInWindow(historySessions as any, todayStr, 7).length;
    const weeklyPercentage = calculateAdherencePercentage(weeklyCompleted, weeklyTarget);

    const activeInjuries = rawInjuries
      .filter((inj) => !inj.isRecovered)
      .map((inj) => ({
        muscleGroup: inj.muscleGroup,
        severity: inj.severity,
      }));

    return {
      athleteName: profileProto?.fullName || athleteName,
      currentWeightKg,
      targetWeightKg,
      currentBodyFatPercent,
      targetBodyFatPercent,
      heightCm,
      entries,
      photos,
      weeklyGoal: {
        completed: weeklyCompleted,
        target: weeklyTarget,
        percentage: weeklyPercentage,
      },
      streakDays,
      totalWorkouts,
      totalVolumeKg,
      adherencePercentage: workoutStats.adherence.percentage || weeklyPercentage,
      heatmapWeeks: buildConsistencyHeatmap(historySessions as any, new Date(), 12),
      preferredMuscleGroups: profileProto?.preferredMuscleGroups ?? [],
      activeInjuries,
      gender: profileProto?.gender ?? "",
    };
  } catch (error) {
    console.warn("[getProgressDashboardData] gRPC call failed:", error);
    return fallbackData;
  }
}
