"use server";

import { createClient } from "@connectrpc/connect";

import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

import type { ProfileViewModel } from "../model/profile.types";
import { getProfileData } from "./get-profile-data";

function mapGoalToEnum(goal: string): string {
  const upper = goal?.toUpperCase() || "";
  if (upper.includes("FAT") || upper.includes("LOSE") || upper === "FAT_LOSS") {
    return "FAT_LOSS";
  }
  if (upper.includes("STRENGTH")) {
    return "STRENGTH";
  }
  if (upper.includes("ENDURANCE")) {
    return "ENDURANCE";
  }
  return "BUILD_MUSCLE";
}

function mapEquipmentToEnum(equipment: string): string {
  const upper = equipment?.toUpperCase() || "";
  if (upper.includes("FULL GYM") || upper.includes("FULL_GYM") || upper.includes("CABLE")) {
    return "FULL_GYM";
  }
  if (upper.includes("DUMBBELL")) {
    return "DUMBBELL_ONLY";
  }
  if (upper.includes("BARBELL")) {
    return "BARBELL";
  }
  if (upper.includes("BAND")) {
    return "RESISTANCE_BAND";
  }
  if (upper.includes("KETTLEBELL")) {
    return "KETTLEBELL";
  }
  if (upper.includes("MACHINE")) {
    return "MACHINE";
  }
  return "BODYWEIGHT";
}

function mapCoachStyleToEnum(style: string): string {
  switch (style?.toLowerCase()) {
    case "strict":
    case "direct":
      return "STRICT";
    case "scientific":
    case "balanced":
      return "SCIENTIFIC";
    default:
      return "MOTIVATIONAL";
  }
}

/**
 * Server Action gọi gRPC ProfileService.UpdateProfile
 * Tự động fetch profile hiện tại và merge, ngăn chặn Data Overwrite Bug làm mất dữ liệu các modal khác.
 */
export async function updateProfileServerAction(
  updated: Partial<ProfileViewModel>,
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
    const heightCm =
      updated.healthMetrics?.heightCm ?? current?.healthMetrics.heightCm ?? 175;
    const targetWeightKg =
      updated.highlights?.targetWeightKg ?? current?.highlights.targetWeightKg ?? 68;
    const bodyFatPercent =
      updated.highlights?.bodyFatPercent ?? current?.highlights.bodyFatPercent ?? 18.5;
    const targetBodyFatPercent =
      updated.healthMetrics?.targetBodyFatPercent ??
      current?.healthMetrics.targetBodyFatPercent ??
      15;
    const dateOfBirth =
      updated.user?.dateOfBirth ?? current?.user.dateOfBirth ?? "1998-05-15";
    const gender =
      (updated.user?.gender ?? current?.user.gender ?? "FEMALE").toUpperCase();
    const experienceLevel =
      (updated.user?.experienceLevel ?? current?.user.experienceLevel ?? "INTERMEDIATE").toUpperCase();

    const rawGoals =
      updated.healthMetrics?.goals ?? current?.healthMetrics.goals ?? ["BUILD_MUSCLE"];
    const goalsEnum = await Promise.all(rawGoals.map(mapGoalToEnum));

    const rawEquipment =
      updated.settings?.availableEquipment ??
      current?.settings.availableEquipment ??
      ["FULL_GYM"];
    const equipmentEnum = await Promise.all(rawEquipment.map(mapEquipmentToEnum));

    const rawMuscles =
      updated.healthMetrics?.preferredMuscleGroups ??
      current?.healthMetrics.preferredMuscleGroups ??
      ["CHEST", "BACK", "LEGS"];
    const muscleGroupsEnum = rawMuscles.map((m) => m.replace(/\s+/g, "_").toUpperCase());

    const coachStyleStr =
      updated.settings?.coachStyle ?? current?.settings.coachStyle ?? "MOTIVATIONAL";
    const coachStyleEnum = await mapCoachStyleToEnum(coachStyleStr);

    const preferredWorkoutTimes =
      updated.settings?.preferredWorkoutTimes ??
      current?.settings.preferredWorkoutTimes ??
      ["Mon PM", "Wed PM", "Fri PM"];

    const res = await client.updateProfile({
      weightKg,
      heightCm,
      dateOfBirth,
      gender,
      goals: goalsEnum,
      experienceLevel,
      preferredWorkoutTimes,
      availableEquipment: equipmentEnum,
      preferredMuscleGroups: muscleGroupsEnum,
      coachStyle: coachStyleEnum,
      targetWeightKg,
      targetBodyFatPercent,
      bodyFatPercent,
    });

    return { success: res.success, message: res.message || "Profile updated successfully" };
  } catch (error: any) {
    console.error("[gRPC ProfileService.UpdateProfile] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to update profile on server" };
  }
}

/**
 * Server Action gọi gRPC ProfileService.LogPeriodicMetrics
 */
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

/**
 * Server Action gọi gRPC ProfileService.ReportInjury
 */
export async function reportInjuryServerAction(injury: {
  muscleGroup: string;
  severity: string;
  notes: string;
}): Promise<{ success: boolean; injuryId?: string; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    const severityUpper = (injury.severity || "MILD").toUpperCase();

    const res = await client.reportInjury({
      muscleGroup: injury.muscleGroup.toUpperCase(),
      severity: severityUpper,
      notes: injury.notes,
    });

    return { success: res.success, injuryId: res.injuryId, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.ReportInjury] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to report injury" };
  }
}

/**
 * Server Action gọi gRPC ProfileService.RecoverInjury
 */
export async function recoverInjuryServerAction(
  injuryId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(ProfileService, transport);

    const res = await client.recoverInjury({ injuryId });
    return { success: res.success, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.RecoverInjury] Error:", error?.message || error);
    return { success: false, message: error?.message || "Failed to update injury recovery status" };
  }
}
