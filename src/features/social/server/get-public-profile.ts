import { createClient } from "@connectrpc/connect";
import "server-only";

import { SocialService } from "@/shared/api/gen/contracts/supporting/social/v1/service/social_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

import { mapFeedItem, mapSocialSummary } from "../model/social.mapper";
import type { PublicProfileVM } from "../model/social.types";

export async function getPublicProfile(userId: string): Promise<PublicProfileVM> {
  const accessToken = await getAccessToken();

  if (!process.env.FITAI_RPC_URL) {
    throw new Error("FITAI_RPC_URL not configured");
  }

  const transport = createServerTransport(accessToken);
  const client = createClient(SocialService, transport);

  const [summaryResult, feedResult] = await Promise.allSettled([
    client.getSocialSummary({ userId }),
    client.getUserProfileFeed({ userId, pageSize: 20, cursor: "" }),
  ]);

  if (summaryResult.status === "rejected") {
    throw new Error(`Failed to load profile: ${summaryResult.reason}`);
  }

  const summary = mapSocialSummary(summaryResult.value);
  const feedItems =
    feedResult.status === "fulfilled" ? feedResult.value.items.map(mapFeedItem) : [];
  const feedNextCursor = feedResult.status === "fulfilled" ? feedResult.value.nextCursor : "";

  const firstItem = feedItems[0];
  const fallbackName = userId ? `Athlete ${userId.slice(-4)}` : "Athlete";
  const authorName = summary.fullName || firstItem?.authorName || fallbackName;
  const authorAvatarUrl = summary.avatarUrl || firstItem?.authorAvatarUrl || "";

  return {
    userId,
    authorName,
    authorAvatarUrl,
    summary,
    feedItems,
    feedNextCursor,
  };
}
