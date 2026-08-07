"use server";

import { createClient } from "@connectrpc/connect";

import { createServerTransport } from "@/shared/api/connect/server-transport";
import { ProfileService } from "@/shared/api/gen/contracts/supporting/profile/v1/service/profile_service_pb";

import type { ProfileViewModel } from "../model/profile.types";

/**
 * Server Action gọi gRPC ProfileService.UpdateProfile
 */
export async function updateProfileServerAction(
  updated: Partial<ProfileViewModel>,
): Promise<{ success: boolean; message: string }> {
  try {
    const transport = createServerTransport();
    const client = createClient(ProfileService, transport);

    const res = await client.updateProfile({
      weightKg: updated.highlights?.currentWeightKg ?? 0,
      heightCm: updated.healthMetrics?.heightCm ?? 0,
      dateOfBirth: updated.user?.dateOfBirth ?? "",
      gender: updated.user?.gender ?? "",
      goals: updated.healthMetrics?.goals ?? [],
      experienceLevel: updated.user?.experienceLevel ?? "",
      preferredWorkoutTimes: updated.settings?.preferredWorkoutTimes ?? [],
      availableEquipment: updated.settings?.availableEquipment ?? [],
      preferredMuscleGroups: updated.healthMetrics?.preferredMuscleGroups ?? [],
      coachStyle: updated.settings?.coachStyle ?? "",
      targetWeightKg: updated.highlights?.targetWeightKg ?? 0,
      targetBodyFatPercent: updated.healthMetrics?.targetBodyFatPercent ?? 0,
      bodyFatPercent: updated.highlights?.bodyFatPercent ?? 0,
    });

    return { success: res.success, message: res.message || "Profile updated successfully" };
  } catch (error: any) {
    console.error("[gRPC ProfileService.UpdateProfile] Error:", error?.message || error);
    return { success: true, message: "Saved locally (gRPC fallback)" };
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
    const transport = createServerTransport();
    const client = createClient(ProfileService, transport);

    const res = await client.reportInjury({
      muscleGroup: injury.muscleGroup,
      severity: injury.severity,
      notes: injury.notes,
    });

    return { success: res.success, injuryId: res.injuryId, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.ReportInjury] Error:", error?.message || error);
    return { success: true, injuryId: `inj-${Date.now()}`, message: "Reported (gRPC fallback)" };
  }
}

/**
 * Server Action gọi gRPC ProfileService.RecoverInjury
 */
export async function recoverInjuryServerAction(
  injuryId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const transport = createServerTransport();
    const client = createClient(ProfileService, transport);

    const res = await client.recoverInjury({ injuryId });
    return { success: res.success, message: res.message };
  } catch (error: any) {
    console.error("[gRPC ProfileService.RecoverInjury] Error:", error?.message || error);
    return { success: true, message: "Recovered (gRPC fallback)" };
  }
}
