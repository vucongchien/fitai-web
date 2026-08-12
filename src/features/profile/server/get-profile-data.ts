import { redirect } from "next/navigation";

import "server-only";

import { createClient } from "@connectrpc/connect";

import { WorkoutExecutionService } from "@/shared/api/gen/contracts/core/workout_execution/v1/service/workout_execution_service_pb";
import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAuthenticatedSession } from "@/shared/auth/session";

import { mapRawDataToProfileViewModel } from "../model/profile.mapper";
import type { ProfileViewModel } from "../model/profile.types";
import { calculateConsecutiveStreakDays } from "@/shared/utils/streak";

export async function getProfileData(): Promise<ProfileViewModel> {
  const { accessToken, userId, userName } = await getAuthenticatedSession();
  if (!accessToken) {
    redirect("/login");
  }

  const athleteName = userName || (userId ? `Athlete ${userId.slice(-4)}` : "Athlete");

  if (process.env.FITAI_RPC_URL && accessToken) {
    try {
      const transport = createServerTransport(accessToken);
      const profileClient = createClient(ProfileService, transport);
      const workoutClient = createClient(WorkoutExecutionService, transport);
      const notificationClient = createClient(NotificationService, transport);

      console.info("[getProfileData] Calling gRPC for userId=", userId);
      const [profileRes, prsRes, notificationRes, historyRes] = await Promise.allSettled([
        typeof profileClient.getProfile === "function"
          ? profileClient.getProfile({ userId: userId || "" })
          : Promise.resolve(undefined),
        typeof workoutClient.getPersonalRecords === "function"
          ? workoutClient.getPersonalRecords({})
          : Promise.resolve({ records: [] }),
        typeof notificationClient.getNotificationSettings === "function"
          ? notificationClient.getNotificationSettings({ userId: userId || "" })
          : Promise.resolve(undefined),
        typeof workoutClient.getWorkoutHistory === "function"
          ? workoutClient.getWorkoutHistory({ limit: 50, offset: 0 })
          : Promise.resolve({ sessions: [] }),
      ]);

      console.info("[getProfileData] profileRes status:", profileRes.status, profileRes.status === "fulfilled" ? profileRes.value : profileRes.reason);

      const profileProto = profileRes.status === "fulfilled" ? profileRes.value : undefined;
      const prListProto = prsRes.status === "fulfilled" ? prsRes.value.records : [];
      const notificationProto =
        notificationRes.status === "fulfilled" ? notificationRes.value : undefined;
      const historySessions =
        historyRes.status === "fulfilled" ? historyRes.value.sessions : [];

      if (profileProto) {
        const totalWorkouts = historySessions.length;
        const totalCalories = historySessions.reduce(
          (sum, s) => sum + (s.totalVolume ? Math.round(s.totalVolume * 0.15) : 0),
          0,
        );
        const streakDays = calculateConsecutiveStreakDays(historySessions);
        const userLevel = Math.max(1, Math.floor(totalWorkouts / 4));

        const prListWithNames = await Promise.all(
          prListProto.map(async (pr) => {
            let name = pr.exerciseId;
            try {
              if (typeof workoutClient.getMotionSpecification === "function") {
                const spec = await workoutClient.getMotionSpecification({ exerciseId: pr.exerciseId });
                if (spec?.exerciseName) {
                  name = spec.exerciseName;
                }
              }
            } catch {
              // fallback to exerciseId if spec not found
            }
            return {
              exerciseId: pr.exerciseId,
              exerciseName: name,
              weightKg: pr.weight,
              reps: pr.reps,
              oneRepMax: pr.oneRepMax,
              achievedAt: pr.achievedAt
                ? new Date(Number(pr.achievedAt.seconds) * 1000).toISOString().split("T")[0]
                : "2026-08-01",
            };
          }),
        );

        return mapRawDataToProfileViewModel({
          user: {
            id: profileProto.userId || userId || "usr-me",
            name: profileProto.fullName || athleteName,
            avatarUrl:
              profileProto.avatarUrl ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
            level: userLevel,
          },
          profileProto,
          prListProto: prListWithNames,
          statsProto: {
            totalWorkouts,
            activeStreakDays: streakDays,
            totalCaloriesKcal: totalCalories,
          },
          notificationProto: notificationProto
            ? {
                enablePush: notificationProto.enablePush,
                enableEmail: notificationProto.enableEmail,
                quietHoursStart: notificationProto.quietHoursStart,
                quietHoursEnd: notificationProto.quietHoursEnd,
              }
            : undefined,
        });
      }
    } catch (error) {
      console.warn("[getProfileData] gRPC calls failed, falling back to local dataset:", error);
    }
  }

  // Dữ liệu ban đầu sạch của người dùng mới, khởi tạo các trường rỗng
  const cleanRawData = {
    user: {
      id: userId || "usr-me",
      name: athleteName,
      avatarUrl:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      level: 1,
    },
    profileProto: {
      userId: userId || "usr-me",
      weightKg: 0,
      heightCm: 0,
      targetWeightKg: 0,
      bodyFatPercent: 0,
      targetBodyFatPercent: 0,
      experienceLevel: "",
      dateOfBirth: "",
      gender: "",
      goals: [],
      preferredMuscleGroups: [],
      availableEquipment: [],
      coachStyle: "",
      injuries: [],
    },
    prListProto: [],
    statsProto: {
      totalWorkouts: 0,
      activeStreakDays: 0,
      totalCaloriesKcal: 0,
    },
  };

  return mapRawDataToProfileViewModel(cleanRawData);
}
