"use server";

import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

export async function registerDeviceToken(deviceToken: string): Promise<boolean> {
  if (!deviceToken) {
    return false;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  if (!accessToken) {
    return false;
  }

  try {
    const client = createClient(NotificationService, createServerTransport(accessToken));
    const response = await client.registerDeviceToken({
      deviceToken,
      deviceType: "WEB",
    });
    return response.success;
  } catch {
    // A failed registration must never block the UI: the user simply does not
    // Get push until the next attempt.
    return false;
  }
}
