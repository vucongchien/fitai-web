"use server";

import { createClient } from "@connectrpc/connect";
import { cookies } from "next/headers";

import { NotificationService } from "@/shared/api/gen/contracts/generic/notification/v1/service/notification_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";

/**
 * Hands an FCM registration token to the backend so the Go notification service
 * can push to this browser.
 *
 * Runs server-side because that is where the access token cookie is readable —
 * the same shape as workout-actions.ts.
 */
export async function registerDeviceToken(deviceToken: string): Promise<boolean> {
  if (!deviceToken) return false;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  if (!accessToken) return false;

  try {
    const client = createClient(NotificationService, createServerTransport(accessToken));
    const response = await client.registerDeviceToken({
      deviceToken,
      deviceType: "WEB",
      // TODO: the backend derives the user from the bearer token; this field is
      // required by the contract. Matches the `userId: "TODO"` seam already in
      // workout-actions.ts — resolve both together when a /me lookup exists.
      userId: "",
    });
    return response.success;
  } catch {
    // A failed registration must never block the UI: the user simply does not
    // get push until the next attempt.
    return false;
  }
}
