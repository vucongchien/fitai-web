import { createClient } from "@connectrpc/connect";
import "server-only";

import { SocialService } from "@/shared/api/gen/contracts/supporting/social/v1/service/social_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

import { mapFeedItem } from "../model/social.mapper";
import type { ActivityFeedVM } from "../model/social.types";

export async function getActivityFeed(): Promise<ActivityFeedVM> {
  const accessToken = await getAccessToken();
  if (!accessToken || !process.env.FITAI_RPC_URL) {
    return { items: [], nextCursor: "" };
  }

  try {
    const transport = createServerTransport(accessToken);
    const client = createClient(SocialService, transport);

    const res = await client.getActivityFeed({ pageSize: 20, cursor: "" });
    return {
      items: res.items.map(mapFeedItem),
      nextCursor: res.nextCursor,
    };
  } catch (error) {
    console.warn("[getActivityFeed] gRPC failed:", error);
    return { items: [], nextCursor: "" };
  }
}
