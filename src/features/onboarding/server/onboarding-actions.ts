"use server";

import { Code, ConnectError, createClient } from "@connectrpc/connect";

import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import {
  mapCoachStyleToProto,
  mapExperienceToProto,
  mapGoalToProto,
  mapOnboardingInjuries,
} from "../domain/onboarding-mapper";
import type { OnboardingValues } from "../domain/onboarding-schema";
import type { PreferredWorkoutTimesMap } from "../domain/workout-times-normalizer";
import { formatWorkoutTimesToProto } from "../domain/workout-times-normalizer";

export async function saveOnboardingProfileServerAction(
  values: OnboardingValues,
  /** IANA zone from the browser; empty lets the backend keep its default (UTC). */
  timeZone = "",
): Promise<{ success: boolean; message: string; aiCoachActivated?: boolean }> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const transport = createServerTransport(accessToken);
    const profileClient = createClient(ProfileService, transport);

    const injuriesPayload = mapOnboardingInjuries(values);

    const preferredTimes = formatWorkoutTimesToProto(
      values.preferredWorkoutTimes as PreferredWorkoutTimesMap,
    );

    const rawGoals = values.goals.length > 0 ? values.goals : ["build-muscle"];

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
      availableEquipment: values.equipment || [],
      preferredMuscleGroups: values.muscleFocus || [],
      coachStyle: mapCoachStyleToProto(values.coachStyle),
      targetWeightKg: values.targetWeightKg,
      targetBodyFatPercent: values.targetBodyFatPercent ?? 15,
      bodyFatPercent: values.bodyFatPercent ?? 18.5,
      timezone: timeZone,
    });

    return {
      success: true,
      message: res.message || "Onboarding profile saved successfully",
      aiCoachActivated: res.aiCoachActivated ?? true,
    };
  } catch (error: any) {
    console.error("[gRPC ProfileService.SaveHealthProfile] Error:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Failed to save onboarding profile to server",
    };
  }
}

export async function initiateOnboardingRoadmapServerAction(): Promise<{
  success: boolean;
  message: string;
  roadmapId?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const coachingClient = createClient(CoachingService, transport);

    const roadmapRes = await coachingClient.initiateRoadmap({});
    return {
      success: true,
      message: "4-week roadmap generated successfully",
      roadmapId: roadmapRes.roadmap?.roadmapId,
    };
  } catch (error: any) {
    // The ProfileCompleted consumer may have created the roadmap first: that is success.
    if (ConnectError.from(error).code === Code.AlreadyExists) {
      return { success: true, message: "Your 4-week roadmap is ready" };
    }
    console.error("[gRPC CoachingService.InitiateRoadmap] Error:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Could not generate your 4-week plan right now. Please try again.",
    };
  }
}
