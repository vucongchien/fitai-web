"use server";

import { createClient } from "@connectrpc/connect";

import { ReactionType as ProtoReactionType } from "@/shared/api/gen/contracts/supporting/social/v1/message/social_messages_pb";
import { SocialService } from "@/shared/api/gen/contracts/supporting/social/v1/service/social_service_pb";
import { createServerTransport } from "@/shared/api/server/transport";
import { getAccessToken } from "@/shared/auth/session";

import { mapComment, mapFeedItem } from "../model/social.mapper";
import type { ActivityFeedVM, CommentVM } from "../model/social.types";

async function getSocialClient() {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Authentication required");
  return createClient(SocialService, createServerTransport(accessToken));
}

export async function followUserAction(
  followingId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = await getSocialClient();
    const res = await client.followUser({ followingId });
    return { success: res.success, message: res.message };
  } catch (error: any) {
    console.error("[followUserAction]", error?.message);
    return { success: false, message: error?.message ?? "Failed to follow" };
  }
}

export async function unfollowUserAction(
  followingId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const client = await getSocialClient();
    const res = await client.unfollowUser({ followingId });
    return { success: res.success, message: res.message };
  } catch (error: any) {
    console.error("[unfollowUserAction]", error?.message);
    return { success: false, message: error?.message ?? "Failed to unfollow" };
  }
}

function toReactionEnum(type: string): ProtoReactionType {
  switch (type) {
    case "LIKE":
      return ProtoReactionType.LIKE;
    case "FIRE":
      return ProtoReactionType.FIRE;
    case "MUSCLE":
      return ProtoReactionType.MUSCLE;
    case "CLAP":
      return ProtoReactionType.CLAP;
    default:
      return ProtoReactionType.UNSPECIFIED;
  }
}

export async function reactTargetAction(
  feedItemId: string,
  reactionType: string,
): Promise<{ success: boolean; currentReaction: string; reactionCount: number }> {
  try {
    const client = await getSocialClient();
    const res = await client.reactTarget({
      feedItemId,
      reactionType: toReactionEnum(reactionType),
    });
    return {
      success: res.success,
      currentReaction: res.currentReaction,
      reactionCount: res.reactionCount,
    };
  } catch (error: any) {
    console.error("[reactTargetAction]", error?.message);
    return { success: false, currentReaction: "", reactionCount: 0 };
  }
}

export async function listCommentsAction(
  feedItemId: string,
  cursor = "",
): Promise<{ comments: CommentVM[]; nextCursor: string }> {
  try {
    const accessToken = await getAccessToken();
    if (!process.env.FITAI_RPC_URL) return { comments: [], nextCursor: "" };
    const client = accessToken
      ? createClient(SocialService, createServerTransport(accessToken))
      : createClient(SocialService, createServerTransport());
    const res = await client.listComments({ feedItemId, pageSize: 20, cursor });
    return {
      comments: res.comments.map(mapComment),
      nextCursor: res.nextCursor,
    };
  } catch (error: any) {
    console.error("[listCommentsAction]", error?.message);
    return { comments: [], nextCursor: "" };
  }
}

export async function addCommentAction(
  feedItemId: string,
  content: string,
  parentId?: string,
): Promise<{ comment: CommentVM | null }> {
  try {
    const client = await getSocialClient();
    const res = await client.addComment({ feedItemId, content, parentId });
    return { comment: res.comment ? mapComment(res.comment as any) : null };
  } catch (error: any) {
    console.error("[addCommentAction]", error?.message);
    return { comment: null };
  }
}

export async function deleteCommentAction(commentId: string): Promise<{ success: boolean }> {
  try {
    const client = await getSocialClient();
    const res = await client.deleteComment({ commentId });
    return { success: res.success };
  } catch (error: any) {
    console.error("[deleteCommentAction]", error?.message);
    return { success: false };
  }
}

export async function fetchMoreFeedAction(cursor: string): Promise<ActivityFeedVM> {
  try {
    const client = await getSocialClient();
    const res = await client.getActivityFeed({ pageSize: 20, cursor });
    return {
      items: res.items.map(mapFeedItem),
      nextCursor: res.nextCursor,
    };
  } catch (error: any) {
    console.error("[fetchMoreFeedAction]", error?.message);
    return { items: [], nextCursor: "" };
  }
}

export async function fetchMoreProfileFeedAction(
  userId: string,
  cursor: string,
): Promise<ActivityFeedVM> {
  try {
    const accessToken = await getAccessToken();
    if (!process.env.FITAI_RPC_URL) return { items: [], nextCursor: "" };
    const client = accessToken
      ? createClient(SocialService, createServerTransport(accessToken))
      : createClient(SocialService, createServerTransport());
    const res = await client.getUserProfileFeed({ userId, pageSize: 20, cursor });
    return {
      items: res.items.map(mapFeedItem),
      nextCursor: res.nextCursor,
    };
  } catch (error: any) {
    console.error("[fetchMoreProfileFeedAction]", error?.message);
    return { items: [], nextCursor: "" };
  }
}
