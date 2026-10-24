import { createClient } from "@connectrpc/connect";
import "server-only";

import { SocialService } from "@/shared/api/gen/contracts/supporting/social/v1/service/social_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken, getAuthenticatedUserId } from "@/shared/auth/session";

import { mapFeedItem } from "../model/social.mapper";
import type { FeedItemVM } from "../model/social.types";

export async function getFeedItemById(postId: string): Promise<FeedItemVM | null> {
  const accessToken = await getAccessToken();
  if (!accessToken || !process.env.FITAI_RPC_URL) {
    return null;
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(SocialService, transport);

    // 1. Search in main activity feed
    const feedRes = await client.getActivityFeed({ pageSize: 50, cursor: "" });
    const foundInFeed = feedRes.items.find((item) => item.id === postId);
    if (foundInFeed) {
      return mapFeedItem(foundInFeed);
    }

    // 2. Search in current user's feed
    const currentUserId = await getAuthenticatedUserId();
    if (currentUserId) {
      const userRes = await client.getUserProfileFeed({
        userId: currentUserId,
        pageSize: 50,
        cursor: "",
      });
      const foundInUser = userRes.items.find((item) => item.id === postId);
      if (foundInUser) {
        return mapFeedItem(foundInUser);
      }
    }

    return null;
  } catch (error) {
    console.warn("[getFeedItemById] failed to find feed item:", error);
    return null;
  }
}
