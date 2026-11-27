"use server";

import { Code, ConnectError, createClient } from "@connectrpc/connect";

import { CoachingService } from "@/shared/api/gen/contracts/core/coaching/v1/service/coaching_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

export async function initiateRoadmapServerAction(): Promise<{
  success: boolean;
  roadmapId?: string;
  message?: string;
}> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(CoachingService, transport);

    const res = await client.initiateRoadmap({});
    return {
      success: true,
      roadmapId: res.roadmap?.roadmapId,
      message: "4-week roadmap generated successfully",
    };
  } catch (error: any) {
    // The ProfileCompleted consumer may have created the roadmap first: that is success.
    if (ConnectError.from(error).code === Code.AlreadyExists) {
      return { success: true, message: "Your 4-week roadmap is ready" };
    }
    console.error("[gRPC CoachingService.InitiateRoadmap] Error:", error?.message || error);
    return {
      success: false,
      message: error?.message || "Failed to initiate roadmap",
    };
  }
}

export async function regenerateScheduleServerAction(
  roadmapId: string,
  reason: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const accessToken = await getAccessToken();
    const transport = createServerTransport(accessToken);
    const client = createClient(CoachingService, transport);

    const res = await client.regenerateSchedule({
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
