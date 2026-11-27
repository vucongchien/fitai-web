"use server";

import { Code, ConnectError, createClient } from "@connectrpc/connect";
import { revalidatePath } from "next/cache";

import { formatWorkoutTimesToProto } from "@/features/onboarding/domain/workout-times-normalizer";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

import type { InjuryDraft } from "../model/injury";
import { toInjuryInput } from "../model/injury";
import { mapCoachStyleToEnum, mapGoalToEnum } from "../model/profile.mapper";
import type { ProfileViewModel } from "../model/profile.types";
import { getProfileData } from "./get-profile-data";

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Silently continue if called outside active request context (e.g. unit tests)
  }
}

export async function updateProfileServerAction(
  updated: Partial<ProfileViewModel>,
  /** IANA zone from the browser; empty keeps the stored zone. */
  timeZone = "",
): Promise<{ success: boolean; message: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    // 1. Fetch current profile state để merge an toàn
    let current: ProfileViewModel | null = null;
    try {
      current = await getProfileData();
    } catch {
      // Offline fallback
    }

    const weightKg =
      updated.highlights?.currentWeightKg ?? current?.highlights.currentWeightKg ?? 70;
    const heightCm = updated.healthMetrics?.heightCm ?? current?.healthMetrics.heightCm ?? 175;
    const targetWeightKg =
      updated.highlights?.targetWeightKg ?? current?.highlights.targetWeightKg ?? 68;
    const bodyFatPercent =
      updated.highlights?.bodyFatPercent ?? current?.highlights.bodyFatPercent ?? 18.5;
    const targetBodyFatPercent =
      updated.healthMetrics?.targetBodyFatPercent ??
      current?.healthMetrics.targetBodyFatPercent ??
      15;
    const dateOfBirth = updated.user?.dateOfBirth ?? current?.user.dateOfBirth ?? "1998-05-15";
    const gender = (updated.user?.gender ?? current?.user.gender ?? "FEMALE").toUpperCase();
    const experienceLevel = (
      updated.user?.experienceLevel ??
      current?.user.experienceLevel ??
      "INTERMEDIATE"
    ).toUpperCase();

    const rawGoals = updated.healthMetrics?.goals ??
      current?.healthMetrics.goals ?? ["BUILD_MUSCLE"];
    const goalsEnum = await Promise.all(rawGoals.map(mapGoalToEnum));

    const rawEquipment =
      updated.settings?.availableEquipment ?? current?.settings.availableEquipment ?? [];

    const rawMuscles =
      updated.healthMetrics?.preferredMuscleGroups ??
      current?.healthMetrics.preferredMuscleGroups ??
      [];

    const coachStyleStr =
      updated.settings?.coachStyle ?? current?.settings.coachStyle ?? "MOTIVATIONAL";
    const coachStyleEnum = await mapCoachStyleToEnum(coachStyleStr);

    const rawPreferredTimes = updated.settings?.preferredWorkoutTimes ??
      current?.settings.preferredWorkoutTimes ?? ["Mon PM", "Wed PM", "Fri PM"];
    const preferredWorkoutTimes = formatWorkoutTimesToProto(rawPreferredTimes as any);

    const res = await client.updateProfile({
      weightKg,
      heightCm,
      dateOfBirth,
      gender,
      goals: goalsEnum,
      experienceLevel,
      preferredWorkoutTimes,
      availableEquipment: rawEquipment,
      preferredMuscleGroups: rawMuscles,
      coachStyle: coachStyleEnum,
      targetWeightKg,
      targetBodyFatPercent,
      bodyFatPercent,
      timezone: timeZone,
    });

    if (res.success) {
      safeRevalidatePath("/profile");
      safeRevalidatePath("/home");
    }

    return { success: res.success, message: res.message || "Profile updated successfully" };
  } catch (error: any) {
    console.error("[gRPC ProfileService.UpdateProfile] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to update profile on server" };
  }
}

export async function logBodyMetricsServerAction(metrics: {
  weightKg: number;
  bodyFatPercent: number;
  heightCm?: number;
  progressPhotoUrl?: string;
}): Promise<{ success: boolean; logId?: string; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    const res = await client.logPeriodicMetrics({
      weightKg: metrics.weightKg,
      bodyFatPercent: metrics.bodyFatPercent,
      heightCm: metrics.heightCm ?? 0,
      progressPhotoUrl: metrics.progressPhotoUrl ?? "",
    });

    safeRevalidatePath("/profile");
    safeRevalidatePath("/home");
    safeRevalidatePath("/progress");

    return {
      success: true,
      logId: res.logId,
      message: res.message || "Metrics recorded successfully",
    };
  } catch (error: any) {
    console.error("[gRPC ProfileService.LogPeriodicMetrics] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to record metrics" };
  }
}

export async function reportInjuryServerAction(
  injury: InjuryDraft,
): Promise<{ success: boolean; injuryId?: string; message?: string; alreadyExists?: boolean }> {
  const input = toInjuryInput(injury);
  if (!input) {
    return { success: false, message: "Choose the painful area first." };
  }
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    const res = await client.reportInjury(input);

    if (res.success) {
      safeRevalidatePath("/profile");
      safeRevalidatePath("/home");
    }

    return { success: res.success, injuryId: res.injuryId, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.ReportInjury] Error:", error?.message || error);
    if (ConnectError.from(error).code === Code.AlreadyExists) {
      return {
        success: false,
        alreadyExists: true,
        message: "This injury is already reported as active.",
      };
    }
    return { success: false, message: error?.message || "Failed to report injury" };
  }
}

export async function recoverInjuryServerAction(
  injuryId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    const res = await client.recoverInjury({ injuryId });

    if (res.success) {
      safeRevalidatePath("/profile");
      safeRevalidatePath("/home");
    }

    return { success: res.success, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.RecoverInjury] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to update injury recovery status" };
  }
}
