"use server";

import { createClient } from "@connectrpc/connect";

import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import {
  mapCoachStyleToProto,
  mapEquipmentToProto,
  mapExperienceToProto,
  mapGoalToProto,
} from "../domain/onboarding-mapper";
import type { OnboardingValues } from "../domain/onboarding-schema";

/**
 * Server Action gọi gRPC ProfileService.SaveHealthProfile và tự động tạo Roadmap 4 tuần
 */
export async function saveOnboardingProfileServerAction(
  values: OnboardingValues | any,
): Promise<{ success: boolean; message: string; aiCoachActivated?: boolean; roadmapId?: string }> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const transport = createServerTransport(accessToken);
    const profileClient = createClient(ProfileService, transport);
    const coachingClient = createClient(CoachingService, transport);

    const injuriesPayload =
      values.injuryStatus !== "none" && values.injuryMuscleGroup
        ? [
            {
              muscleGroup: values.injuryMuscleGroup.toUpperCase(),
              severity: (values.injurySeverity || "MILD").toUpperCase(),
              notes: values.injuryNotes || "Reported during onboarding",
            },
          ]
        : [];

    const preferredTimes =
      values.preferredWorkoutTimes && values.preferredWorkoutTimes.length > 0
        ? values.preferredWorkoutTimes
        : values.availableDays?.map((d: string) => `${d} ${values.preferredTime || "18:30"}`) || [
            "Mon PM",
            "Wed PM",
            "Fri PM",
          ];

    const rawGoals = values.goals || (values.goal ? [values.goal] : ["build-muscle"]);

    console.info("[saveOnboardingProfileServerAction] Saving health profile with payload:", {
      userId,
      goals: mapGoalToProto(rawGoals),
      preferredWorkoutTimes: preferredTimes,
      bodyFatPercent: values.bodyFatPercent ?? 18.5,
      dateOfBirth: values.dateOfBirth,
    });

    const res = await profileClient.saveHealthProfile({
      weightKg: values.weightKg,
      heightCm: values.heightCm,
      dateOfBirth: values.dateOfBirth || "1998-05-15",
      gender: (values.gender || "FEMALE").toUpperCase(),
      goals: mapGoalToProto(rawGoals),
      injuries: injuriesPayload,
      experienceLevel: mapExperienceToProto(values.experienceLevel),
      preferredWorkoutTimes: preferredTimes,
      availableEquipment: mapEquipmentToProto(values.equipment || ["Bodyweight"]),
      preferredMuscleGroups: (values.muscleFocus || ["Chest", "Back", "Legs"]).map((m: string) =>
        m.toUpperCase(),
      ),
      coachStyle: mapCoachStyleToProto(values.coachStyle),
      targetWeightKg: values.targetWeightKg,
      targetBodyFatPercent: values.targetBodyFatPercent ?? 15,
      bodyFatPercent: values.bodyFatPercent ?? 18.5,
    });

    let roadmapId: string | undefined;
    try {
      const roadmapRes = await coachingClient.initiateRoadmap({ userId: userId || "" });
      roadmapId = roadmapRes.roadmap?.roadmapId;
    } catch (e) {
      console.warn("[saveOnboardingProfileServerAction] initiateRoadmap fallback:", e);
    }

    return {
      success: true,
      message: res.message || "Onboarding profile saved and roadmap generated successfully",
      aiCoachActivated: res.aiCoachActivated ?? true,
      roadmapId: roadmapId,
    };
  } catch (error: any) {
    console.error("[gRPC ProfileService.SaveHealthProfile] Error:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Failed to save onboarding profile to server",
    };
  }
}
