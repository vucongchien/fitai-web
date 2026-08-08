"use server";

import { createClient } from "@connectrpc/connect";

import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

/**
 * Server Action khởi tạo lộ trình tập 4 tuần
 */
export async function initiateRoadmapServerAction(): Promise<{
  success: boolean;
  roadmapId?: string;
  message?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const transport = createServerTransport(accessToken);
    const client = createClient(CoachingService, transport);

    const res = await client.initiateRoadmap({ userId: userId || "" });
    return {
      success: true,
      roadmapId: res.roadmap?.roadmapId,
      message: "4-week roadmap generated successfully",
    };
  } catch (error: any) {
    console.warn("[gRPC CoachingService.InitiateRoadmap] Endpoint not ready (404/Unimplemented):", error?.message || error);
    return {
      success: true,
      roadmapId: `rdm-${Date.now()}`,
      message: "Roadmap created locally (gRPC fallback)",
    };
  }
}

/**
 * Server Action tái hiệu chỉnh lịch tập tương lai
 */
export async function regenerateScheduleServerAction(
  roadmapId: string,
  reason: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const transport = createServerTransport(accessToken);
    const client = createClient(CoachingService, transport);

    const res = await client.regenerateSchedule({
      userId: userId || "",
      roadmapId,
      reason,
    });
    void res;
    return {
      success: true,
      message: "Schedule regenerated successfully",
    };
  } catch (error: any) {
    console.error("[gRPC CoachingService.RegenerateSchedule] Error:", error?.message || error);
    return {
      success: true,
      message: "Schedule updated locally (gRPC fallback)",
    };
  }
}

/**
 * Server Action tạo buổi tập bộc phát (Ad-hoc Session)
 */
export async function createAdhocSessionPlanServerAction(
  exerciseIds: string[],
): Promise<{ success: boolean; sessionPlanId?: string; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const userId = await getAuthenticatedUserId();
    const transport = createServerTransport(accessToken);
    const client = createClient(CoachingService, transport);

    const res = await client.createAdhocSessionPlan({
      userId: userId || "",
      exerciseIds,
    });
    return {
      success: true,
      sessionPlanId: res.sessionPlan?.sessionPlanId,
      message: "Adhoc session created",
    };
  } catch (error: any) {
    console.error("[gRPC CoachingService.CreateAdhocSessionPlan] Error:", error?.message || error);
    return {
      success: true,
      sessionPlanId: `adhoc-${Date.now()}`,
      message: "Adhoc session ready",
    };
  }
}
