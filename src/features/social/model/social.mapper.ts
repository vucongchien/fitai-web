import type {
  FeedItem,
  GetSocialSummaryResponse,
  CommentItem,
  WorkoutMetricsSummary,
} from "@/shared/api/gen/contracts/supporting/social/v1/message/social_messages_pb";

import type {
  CommentVM,
  FeedItemVM,
  ReactionType,
  SocialSummaryVM,
  WorkoutMetricsVM,
} from "./social.types";

function protoTimestampToISO(ts?: { seconds: bigint | number }): string {
  if (!ts) return new Date().toISOString();
  return new Date(Number(ts.seconds) * 1000).toISOString();
}

function mapWorkoutMetrics(data: WorkoutMetricsSummary): WorkoutMetricsVM {
  return {
    sessionId: data.sessionId,
    workoutTitle: data.workoutTitle,
    durationSeconds: data.durationSeconds,
    totalVolumeKg: data.totalVolumeKg,
    exerciseCount: data.exerciseCount,
    totalSets: data.totalSets,
  };
}

export function mapFeedItem(item: FeedItem): FeedItemVM {
  const rawType = item.itemType?.toString() ?? "";
  const itemType: FeedItemVM["itemType"] = rawType.includes("WORKOUT_ACTIVITY")
    ? "WORKOUT_ACTIVITY"
    : "POST";

  return {
    id: item.id,
    userId: item.userId,
    authorName: item.authorName,
    authorAvatarUrl: item.authorAvatarUrl,
    itemType,
    caption: item.caption,
    reactionCount: item.reactionCount,
    commentCount: item.commentCount,
    userReaction: (item.userReaction ?? "") as ReactionType,
    createdAt: protoTimestampToISO(item.createdAt as any),
    workoutData: item.workoutData ? mapWorkoutMetrics(item.workoutData) : undefined,
  };
}

export function mapSocialSummary(res: GetSocialSummaryResponse): SocialSummaryVM {
  return {
    userId: res.userId,
    followerCount: res.followerCount,
    followingCount: res.followingCount,
    postCount: res.postCount,
    isFollowing: res.isFollowing,
  };
}

export function mapComment(c: CommentItem): CommentVM {
  return {
    id: c.id,
    userId: c.userId,
    authorName: c.authorName,
    authorAvatarUrl: c.authorAvatarUrl,
    feedItemId: c.feedItemId,
    parentId: c.parentId ?? undefined,
    content: c.content,
    createdAt: protoTimestampToISO(c.createdAt as any),
  };
}
